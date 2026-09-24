use super::*;

#[derive(Deserialize)]
struct Coverage {
    r#ref: String,
    topic: String,
    strands: Vec<String>,
    activities: Vec<String>,
}

#[test]
fn every_curriculum_expectation_links_to_existing_learning_material() {
    let rows: Vec<Coverage> =
        serde_json::from_str(include_str!("../../../docs/math-5-coverage.json")).unwrap();
    let content = catalog().unwrap();
    let expected: HashSet<_> = [
        ("1.1", 7),
        ("1.2", 5),
        ("2", 5),
        ("3.1", 7),
        ("3.2", 5),
        ("4.1", 5),
        ("4.2", 5),
    ]
    .into_iter()
    .flat_map(|(area, n)| (1..=n).map(move |i| format!("{area}/{i}")))
    .collect();
    assert_eq!(rows.len(), 39);
    assert_eq!(
        rows.iter().map(|r| r.r#ref.clone()).collect::<HashSet<_>>(),
        expected
    );
    for row in rows {
        let topic = content.topics.iter().find(|t| t.id == row.topic).unwrap();
        assert!(!row.strands.is_empty());
        for strand in row.strands {
            for level in [
                Difficulty::Vorschule,
                Difficulty::Koenner,
                Difficulty::Streber,
            ] {
                let id = format!("by.math.5.{}.{strand}.{}.v1", row.topic, level.as_str());
                assert!(
                    content.exercises.iter().any(|e| e.id == id && !e.legacy),
                    "{}: {id}",
                    row.r#ref
                );
            }
        }
        for title in row.activities {
            assert!(
                topic
                    .activities
                    .iter()
                    .any(|a| a.title == title && !a.prompt.is_empty() && !a.check.is_empty()),
                "{}: {title}",
                row.r#ref
            );
        }
    }
}

#[test]
fn square_practice_is_complete_and_grades_forward_and_reverse_questions() {
    let content = catalog().unwrap();
    let squares = [
        0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400,
    ];
    for (n, square) in squares.into_iter().enumerate() {
        for level in [
            Difficulty::Vorschule,
            Difficulty::Koenner,
            Difficulty::Streber,
        ] {
            let id = format!("by.math.5.multiply.square-{n:02}.{}.v1", level.as_str());
            let exercise = content.exercises.iter().find(|e| e.id == id).unwrap();
            let answer = if level == Difficulty::Streber {
                n
            } else {
                square
            };
            assert!(is_correct(exercise, &answer.to_string()), "{id}");
            assert!(!is_correct(exercise, &(answer + 1).to_string()), "{id}");
        }
    }
}

#[test]
fn new_material_checks_meaningful_boundary_cases_and_decimal_units() {
    let content = catalog().unwrap();
    for (suffix, correct, wrong) in [
        (
            "numbers.word-to-number.streber",
            "3 007 040 002",
            "3 070 400 002",
        ),
        ("add.written-exchange.streber", "1217543", "1217542"),
        ("geometry.nested-circles.koenner", "1", "2"),
        ("multiply.division-steps.koenner", "0", "6"),
        ("multiply.counting-limits.koenner", "3", "4"),
        ("terms.equal-calculation-lines.streber", "24", "36"),
        ("units.mass-table.streber", "4,005", "4,05"),
        ("units.time-is-different.streber", "3723", "10203"),
        ("area.decimal-area-conversion.streber", "3,5", "35"),
        ("area.approximate-area.streber", "24", "12"),
    ] {
        let id = format!("by.math.5.{suffix}.v1");
        let exercise = content.exercises.iter().find(|e| e.id == id).unwrap();
        assert!(is_correct(exercise, correct), "{id}");
        assert!(!is_correct(exercise, wrong), "{id}");
    }
    let area = content.topics.iter().find(|t| t.id == "area").unwrap();
    assert_eq!(area.tables[0].headers.len(), 7);
    assert_eq!(
        area.tables[0].rows[1],
        ["0", "01", "25", "00", "00", "00", "00"]
    );
}
