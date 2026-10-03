use super::*;
use crate::{content, learning};
use std::collections::HashSet;

fn setup() -> (tempfile::TempDir, Connection) {
    let directory = tempfile::tempdir().unwrap();
    let connection = database::open(&directory.path().join("roman.sqlite3")).unwrap();
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Alex".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    (directory, connection)
}

fn row_counts(connection: &Connection) -> (i64, i64, i64) {
    connection
        .query_row(
            "SELECT (SELECT COUNT(*) FROM answer_submissions), (SELECT COUNT(*) FROM point_entries), (SELECT COUNT(*) FROM learning_progress)",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .unwrap()
}

// Independent additive/subtractive reading verifies every generated representation.
fn read_roman(roman: &str) -> i32 {
    let values: Vec<_> = roman
        .bytes()
        .map(|sign| match sign {
            b'I' => 1,
            b'V' => 5,
            b'X' => 10,
            b'L' => 50,
            b'C' => 100,
            b'D' => 500,
            b'M' => 1000,
            _ => panic!("unexpected Roman sign"),
        })
        .collect();
    values
        .iter()
        .enumerate()
        .map(|(index, value)| {
            if values.get(index + 1).is_some_and(|next| next > value) {
                -value
            } else {
                *value
            }
        })
        .sum()
}

#[test]
fn formats_subtractive_boundaries_and_extended_thousands() {
    for (value, expected) in [
        (1, "I"),
        (4, "IV"),
        (9, "IX"),
        (40, "XL"),
        (90, "XC"),
        (400, "CD"),
        (900, "CM"),
        (1000, "M"),
        (3888, "MMMDCCCLXXXVIII"),
        (3999, "MMMCMXCIX"),
        (4000, "MMMM"),
        (4999, "MMMMCMXCIX"),
        (9999, "MMMMMMMMMCMXCIX"),
    ] {
        assert_eq!(format_roman(value), expected);
        assert_eq!(read_roman(expected), i32::from(value));
    }
    assert_eq!(explanation(9444), "MMMMMMMMMCDXLIV besteht aus diesen Gruppen: MMMMMMMMM = 9000, CD = 400, XL = 40, IV = 4.\nZusammen: 9000 + 400 + 40 + 4 = 9444.");
    assert_eq!(explanation(4000), "MMMM = 4000.");
}

#[test]
fn every_number_has_a_unique_correct_representation_in_both_directions() {
    let mut representations = HashSet::new();
    let mut identities = HashSet::new();
    for value in 1..=9999 {
        let roman = format_roman(value);
        assert_eq!(read_roman(&roman), i32::from(value));
        assert!(representations.insert(roman));
        for direction in [Direction::DecimalToRoman, Direction::RomanToDecimal] {
            for difficulty in [
                Difficulty::Vorschule,
                Difficulty::Koenner,
                Difficulty::Streber,
            ] {
                let id = question_id(direction, difficulty, value);
                assert!(identities.insert(id.clone()));
                assert_eq!(parse_id(&id).unwrap(), (direction, difficulty, value));
                let exercise = exercise_from_id(&id).unwrap();
                assert!(content::is_correct(&exercise, &exercise.answer));
                assert_eq!(exercise.competency_id, COMPETENCY);
            }
        }
    }
    assert_eq!(representations.len(), 9999);
    assert_eq!(identities.len(), 9999 * 2 * 3);
}

#[test]
fn rejects_alias_ids_invalid_directions_and_ranges() {
    let (_directory, mut connection) = setup();
    for id in [
        "",
        "by.math.5.roman-random.decimal-to-roman.koenner.0.v1",
        "by.math.5.roman-random.decimal-to-roman.koenner.10000.v1",
        "by.math.5.roman-random.decimal-to-roman.koenner.65536.v1",
        "by.math.5.roman-random.decimal-to-roman.koenner.-1.v1",
        "by.math.5.roman-random.decimal-to-roman.koenner.+4.v1",
        "by.math.5.roman-random.decimal-to-roman.koenner.04.v1",
        "by.math.5.roman-random.decimal-to-roman.koenner.4.v2",
        "by.math.5.roman-random.decimal-to-roman.koenner.4.v1.extra",
        "by.math.5.roman-random.decimal-to-roman.koenner.4.v1\0",
        "by.math.5.roman-random.decimal-to-roman.Koenner.4.v1",
        "by.math.5.roman-random.decimal-to-roman.unknown.4.v1",
        "by.math.5.roman-random.unknown.koenner.4.v1",
        "by.math.5.roman-random.roman-to-decimal.koenner.4.0.v1",
        "by.math.5.roman-random.decimal-to-roman.koenner. 4.v1",
    ] {
        assert!(exercise_from_id(id).is_err(), "{id}");
        assert!(get_question(&mut connection, Direction::DecimalToRoman, Some(id)).is_err());
        assert!(learning::submit_answer(&mut connection, "invalid-id", id, "IV").is_err());
    }
    assert!(parse_id(&"x".repeat(101)).is_err());
    for direction in ["\"decimal\"", "\"roman_to_decimal\"", "null", "3"] {
        assert!(serde_json::from_str::<Direction>(direction).is_err());
    }
    assert_eq!(row_counts(&connection), (0, 0, 0));
}

#[test]
fn random_questions_follow_saved_difficulty_exclude_previous_value_and_hide_solutions() {
    let (_directory, mut connection) = setup();
    database::set_difficulty(&connection, "streber").unwrap();
    for previous_value in [1, 5000, 9999] {
        let previous = question_id(
            Direction::DecimalToRoman,
            Difficulty::Vorschule,
            previous_value,
        );
        for direction in [Direction::DecimalToRoman, Direction::RomanToDecimal] {
            for _ in 0..32 {
                let question = get_question(&mut connection, direction, Some(&previous)).unwrap();
                let (actual_direction, difficulty, value) = parse_id(&question.id).unwrap();
                assert_eq!(actual_direction, direction);
                assert_eq!(difficulty, Difficulty::Streber);
                assert_ne!(value, previous_value);
                assert!((1..=9999).contains(&value));
                let json = serde_json::to_value(&question).unwrap();
                assert!(json.get("answer").is_none());
                assert!(json.get("solution").is_none());
                assert!(json.get("explanation").is_none());
                assert!(json.get("value").is_none());
                assert_eq!(json["subject"], "mathematics");
                assert_eq!(json["topicId"], "numbers");
                assert_eq!(json["competencyId"], COMPETENCY);
                assert_eq!(json["grade"], 5);
                assert!(json["source"].as_str().unwrap().contains("M5 1.1"));
                assert!(json["curriculumVersion"].as_str().unwrap().contains("9999"));
                assert_eq!(json["solved"], false);
                assert_eq!(json["options"], serde_json::json!([]));
                assert_eq!(
                    json["answerKind"],
                    if direction == Direction::DecimalToRoman {
                        "text"
                    } else {
                        "number"
                    }
                );
                assert!(question.hint.contains("MMMM = 4000"));
            }
        }
    }
    let first = get_question(&mut connection, Direction::DecimalToRoman, None).unwrap();
    assert!((1..=9999).contains(&parse_id(&first.id).unwrap().2));
    assert_eq!(row_counts(&connection), (0, 0, 0));
}

#[test]
fn only_canonical_roman_answers_are_correct_and_decimal_input_keeps_existing_normalization() {
    let roman = exercise(Direction::DecimalToRoman, Difficulty::Koenner, 49);
    for right in ["XLIX", " xlix ", "XlIx"] {
        assert!(content::is_correct(&roman, right));
    }
    for wrong in ["IL", "XXXXVIIII", "XL IX", "49", "ＸＬＩＸ", "XLIX.", ""] {
        assert!(!content::is_correct(&roman, wrong), "{wrong}");
    }
    let decimal = exercise(Direction::RomanToDecimal, Difficulty::Koenner, 9999);
    for right in ["9999", "9 999", "9\u{00a0}999", "09999", "9999,0"] {
        assert!(content::is_correct(&decimal, right));
    }
    for wrong in [
        "9.999",
        "MMMMMMMMMCMXCIX",
        "10000",
        "9999+0",
        "9999,1",
        "-9999",
    ] {
        assert!(!content::is_correct(&decimal, wrong), "{wrong}");
    }
}

#[test]
fn first_correct_answers_award_one_two_three_once_and_request_replays_are_idempotent() {
    let (_directory, mut connection) = setup();
    for direction in [Direction::DecimalToRoman, Direction::RomanToDecimal] {
        for (difficulty, expected) in [
            (Difficulty::Vorschule, 1),
            (Difficulty::Koenner, 2),
            (Difficulty::Streber, 3),
        ] {
            // Points follow the generated task's stable level, even after a level change.
            database::set_difficulty(&connection, "vorschule").unwrap();
            let exercise = exercise(direction, difficulty, 9444);
            let request = format!("{}-{}", direction.as_str(), difficulty.as_str());
            let wrong = learning::submit_answer(
                &mut connection,
                &format!("{request}-wrong"),
                &exercise.id,
                "wrong",
            )
            .unwrap();
            assert!(!wrong.correct);
            assert_eq!(wrong.points_awarded, 0);
            let correct =
                learning::submit_answer(&mut connection, &request, &exercise.id, &exercise.answer)
                    .unwrap();
            assert!(correct.correct);
            assert_eq!(correct.points_awarded, expected);
            assert!(correct.explanation.contains("9000 + 400 + 40 + 4 = 9444"));
            let replay =
                learning::submit_answer(&mut connection, &request, &exercise.id, &exercise.answer)
                    .unwrap();
            assert_eq!(replay.points_awarded, expected);
            assert_eq!(replay.wallet.balance, correct.wallet.balance);
            let repeat = learning::submit_answer(
                &mut connection,
                &format!("{request}-again"),
                &exercise.id,
                &exercise.answer,
            )
            .unwrap();
            assert_eq!(repeat.points_awarded, 0);
            assert!(
                learning::submit_answer(&mut connection, &request, &exercise.id, "other").is_err()
            );
            let other = question_id(direction, difficulty, 9445);
            assert!(
                learning::submit_answer(&mut connection, &request, &other, &exercise.answer)
                    .is_err()
            );
        }
    }
    assert_eq!(learning::wallet(&connection).unwrap().balance, 12);
    let progress = database::list_progress(&connection).unwrap();
    assert_eq!(progress.len(), 1);
    assert_eq!(progress[0].competency_id, COMPETENCY);
    assert_eq!((progress[0].attempts, progress[0].correct), (18, 12));
    assert_eq!(row_counts(&connection), (18, 6, 1));
}

#[test]
fn generated_and_historical_answers_survive_reopening_without_changed_points_or_schema() {
    let (directory, mut connection) = setup();
    connection.execute_batch("INSERT INTO point_entries (profile_id,kind,item_id,amount,created_at) VALUES (1,'answer','sample.math.add.v1',10,'2026-09-01'); INSERT INTO answer_submissions (request_id,profile_id,question_id,answer,correct,points_awarded,created_at) VALUES ('historical',1,'sample.math.add.v1','42',1,10,'2026-09-01');").unwrap();
    database::set_difficulty(&connection, "streber").unwrap();
    let exercise = exercise(Direction::DecimalToRoman, Difficulty::Streber, 9999);
    let result = learning::submit_answer(
        &mut connection,
        "roman-save",
        &exercise.id,
        &exercise.answer,
    )
    .unwrap();
    assert_eq!((result.points_awarded, result.wallet.balance), (3, 13));
    let version: i64 = connection
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .unwrap();
    drop(connection);
    let mut reopened = database::open(&directory.path().join("roman.sqlite3")).unwrap();
    let replay =
        learning::submit_answer(&mut reopened, "roman-save", &exercise.id, &exercise.answer)
            .unwrap();
    assert_eq!((replay.points_awarded, replay.wallet.balance), (3, 13));
    let repeat =
        learning::submit_answer(&mut reopened, "roman-new", &exercise.id, &exercise.answer)
            .unwrap();
    assert_eq!((repeat.points_awarded, repeat.wallet.balance), (0, 13));
    let historical =
        learning::submit_answer(&mut reopened, "historical", "sample.math.add.v1", "42").unwrap();
    assert_eq!(
        (historical.points_awarded, historical.wallet.balance),
        (10, 13)
    );
    let timestamp: String = reopened
        .query_row(
            "SELECT created_at FROM answer_submissions WHERE request_id='historical'",
            [],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(timestamp, "2026-09-01");
    assert_eq!(
        database::get_difficulty(&reopened).unwrap(),
        Difficulty::Streber
    );
    let reopened_version: i64 = reopened
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .unwrap();
    assert_eq!(reopened_version, version);
    assert_eq!(database::list_progress(&reopened).unwrap()[0].attempts, 2);
}

#[test]
fn loading_without_profile_is_read_only_and_answering_requires_saved_profile() {
    let directory = tempfile::tempdir().unwrap();
    let mut connection = database::open(&directory.path().join("empty.sqlite3")).unwrap();
    let question = get_question(&mut connection, Direction::DecimalToRoman, None).unwrap();
    let exercise = exercise_from_id(&question.id).unwrap();
    assert!(learning::submit_answer(
        &mut connection,
        "no-profile",
        &exercise.id,
        &exercise.answer
    )
    .is_err());
    assert!(database::get_profile(&connection).unwrap().is_none());
    assert_eq!(row_counts(&connection), (0, 0, 0));
}

#[test]
fn invalid_answers_and_requests_do_not_write_and_failed_booking_rolls_back_all_rows() {
    let (_directory, mut connection) = setup();
    let exercise = exercise(Direction::DecimalToRoman, Difficulty::Koenner, 4000);
    for (request, answer) in [
        ("", "MMMM"),
        ("bad.request", "MMMM"),
        ("one", ""),
        ("one", "  "),
        ("one", "M\0MMM"),
    ] {
        assert!(learning::submit_answer(&mut connection, request, &exercise.id, answer).is_err());
    }
    assert!(
        learning::submit_answer(&mut connection, &"a".repeat(81), &exercise.id, "MMMM").is_err()
    );
    assert!(
        learning::submit_answer(&mut connection, "long", &exercise.id, &"M".repeat(121)).is_err()
    );
    assert_eq!(row_counts(&connection), (0, 0, 0));
    for table in ["point_entries", "answer_submissions"] {
        connection.execute_batch(&format!("CREATE TRIGGER fail_roman BEFORE INSERT ON {table} BEGIN SELECT RAISE(ABORT, 'test'); END;")).unwrap();
        assert!(
            learning::submit_answer(&mut connection, "rollback", &exercise.id, "MMMM").is_err()
        );
        assert_eq!(row_counts(&connection), (0, 0, 0));
        connection
            .execute_batch("DROP TRIGGER fail_roman;")
            .unwrap();
    }
    let success =
        learning::submit_answer(&mut connection, "rollback", &exercise.id, "MMMM").unwrap();
    assert_eq!((success.points_awarded, success.wallet.balance), (2, 2));
    assert_eq!(row_counts(&connection), (1, 1, 1));
}
