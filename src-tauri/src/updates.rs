use reqwest::{Client, Url};
use semver::Version;
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tauri::{Manager, Runtime, Webview};
use tauri_plugin_updater::{Update, UpdaterExt};

const RELEASES_API: &str = "https://api.github.com/repos/dr-dimitri/lernwelt/releases";
const RELEASE_DOWNLOADS: &str = "https://github.com/dr-dimitri/lernwelt/releases/download/";
const STABLE_MANIFEST: &str =
    "https://github.com/dr-dimitri/lernwelt/releases/latest/download/latest.json";
const CHECK_TIMEOUT: Duration = Duration::from_secs(15);
const CHECK_ERROR: &str = "Die Update-Prüfung konnte nicht sicher abgeschlossen werden.";

#[derive(Deserialize)]
struct ReleaseAsset {
    name: String,
    state: String,
    size: u64,
    browser_download_url: String,
}

#[derive(Deserialize)]
struct GithubRelease {
    tag_name: String,
    draft: bool,
    prerelease: bool,
    assets: Vec<ReleaseAsset>,
}

struct Candidate {
    version: Version,
    release: GithubRelease,
    manifest: Url,
}

// Matches the official JavaScript Update constructor; the native resource is
// still downloaded, signature-checked and installed by the Tauri plugin.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMetadata {
    rid: u32,
    current_version: String,
    version: String,
    body: Option<String>,
    raw_json: serde_json::Value,
    prerelease: bool,
}

fn newer(version: &Version, current: &Version) -> bool {
    version.cmp_precedence(current).is_gt()
}

fn select_release(releases: Vec<GithubRelease>, current: &Version) -> Option<Candidate> {
    releases
        .into_iter()
        .filter_map(|release| {
            if release.draft {
                return None;
            }
            let version = Version::parse(
                release
                    .tag_name
                    .strip_prefix('v')
                    .unwrap_or(&release.tag_name),
            )
            .ok()?;
            if !newer(&version, current) {
                return None;
            }
            let manifest = Url::parse(&format!(
                "{RELEASE_DOWNLOADS}{}/latest.json",
                release.tag_name
            ))
            .ok()?;
            if !release.assets.iter().any(|asset| {
                asset.name == "latest.json"
                    && asset.state == "uploaded"
                    && asset.size > 0
                    && asset.browser_download_url == manifest.as_str()
            }) {
                return None;
            }
            Some(Candidate {
                version,
                release,
                manifest,
            })
        })
        .max_by(|a, b| a.version.cmp_precedence(&b.version))
}

fn remaining(started: Instant) -> Result<Duration, String> {
    CHECK_TIMEOUT
        .checked_sub(started.elapsed())
        .filter(|time| !time.is_zero())
        .ok_or_else(|| CHECK_ERROR.to_owned())
}

async fn releases(client: &Client, started: Instant) -> Result<Vec<GithubRelease>, String> {
    let mut releases = Vec::new();
    // Read all pages, with a shared time budget and a hard size/page limit.
    // Hitting a limit is an error, never an incomplete "up to date" result.
    for page in 1..=10 {
        let mut response = client
            .get(format!("{RELEASES_API}?per_page=100&page={page}"))
            .header("Accept", "application/vnd.github+json")
            .header("X-GitHub-Api-Version", "2022-11-28")
            .timeout(remaining(started)?)
            .send()
            .await
            .and_then(reqwest::Response::error_for_status)
            .map_err(|_| CHECK_ERROR.to_owned())?;
        let mut body = Vec::new();
        while let Some(chunk) = response.chunk().await.map_err(|_| CHECK_ERROR.to_owned())? {
            if body.len() + chunk.len() > 4 * 1024 * 1024 {
                return Err(CHECK_ERROR.to_owned());
            }
            body.extend_from_slice(&chunk);
        }
        let mut batch: Vec<GithubRelease> =
            serde_json::from_slice(&body).map_err(|_| CHECK_ERROR.to_owned())?;
        let complete = batch.len() < 100;
        releases.append(&mut batch);
        if complete {
            return Ok(releases);
        }
    }
    Err(CHECK_ERROR.to_owned())
}

fn validate_package(
    version: &str,
    url: &Url,
    signature: &str,
    candidate: Option<&Candidate>,
) -> Result<(), String> {
    let parsed = Version::parse(version).map_err(|_| CHECK_ERROR.to_owned())?;
    let tag = candidate
        .map(|candidate| candidate.release.tag_name.clone())
        .unwrap_or_else(|| format!("v{parsed}"));
    let prefix = format!("{RELEASE_DOWNLOADS}{tag}/");
    let name = url.as_str().strip_prefix(&prefix).unwrap_or_default();
    if signature.trim().is_empty()
        || name.is_empty()
        || name.contains(['/', '?', '#'])
        || url.username() != ""
        || url.password().is_some()
        || url.port().is_some()
    {
        return Err(CHECK_ERROR.to_owned());
    }
    if let Some(candidate) = candidate {
        if parsed != candidate.version
            || !candidate.release.assets.iter().any(|asset| {
                asset.state == "uploaded"
                    && asset.size > 0
                    && asset.browser_download_url == url.as_str()
            })
        {
            return Err(CHECK_ERROR.to_owned());
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn check_app_update<R: Runtime>(
    webview: Webview<R>,
    include_prereleases: bool,
) -> Result<Option<UpdateMetadata>, String> {
    let started = Instant::now();
    let candidate = if include_prereleases {
        let client = Client::builder()
            .user_agent("Lernwelt-Updater")
            .build()
            .map_err(|_| CHECK_ERROR.to_owned())?;
        let current = &webview.app_handle().package_info().version;
        let Some(candidate) = select_release(releases(&client, started).await?, current) else {
            return Ok(None);
        };
        Some(candidate)
    } else {
        None
    };
    let endpoint = candidate
        .as_ref()
        .map(|candidate| candidate.manifest.clone())
        .unwrap_or(Url::parse(STABLE_MANIFEST).map_err(|_| CHECK_ERROR.to_owned())?);
    let update = webview
        .updater_builder()
        .endpoints(vec![endpoint])
        .map_err(|_| CHECK_ERROR.to_owned())?
        .timeout(remaining(started)?)
        .version_comparator(|current, remote| newer(&remote.version, &current))
        .build()
        .map_err(|_| CHECK_ERROR.to_owned())?
        .check()
        .await
        .map_err(|_| CHECK_ERROR.to_owned())?;
    let Some(update) = update else {
        // A selected newer release with inconsistent manifest must not become
        // a misleading successful check after a release was edited in GitHub.
        return if candidate.is_some() {
            Err(CHECK_ERROR.to_owned())
        } else {
            Ok(None)
        };
    };
    validate_package(
        &update.version,
        &update.download_url,
        &update.signature,
        candidate.as_ref(),
    )?;
    Ok(Some(register_update(
        &webview,
        update,
        candidate.is_some_and(|candidate| candidate.release.prerelease),
    )))
}

fn register_update<R: Runtime>(
    webview: &Webview<R>,
    update: Update,
    prerelease: bool,
) -> UpdateMetadata {
    let current_version = update.current_version.clone();
    let version = update.version.clone();
    let body = update.body.clone();
    let raw_json = update.raw_json.clone();
    UpdateMetadata {
        rid: webview.resources_table().add(update),
        current_version,
        version,
        body,
        raw_json,
        prerelease,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn release(version: &str, prerelease: bool) -> GithubRelease {
        let tag = format!("v{version}");
        GithubRelease {
            assets: vec![ReleaseAsset {
                name: "latest.json".into(),
                state: "uploaded".into(),
                size: 100,
                browser_download_url: format!("{RELEASE_DOWNLOADS}{tag}/latest.json"),
            }],
            tag_name: tag,
            draft: false,
            prerelease,
        }
    }

    #[test]
    fn selects_highest_version_instead_of_publish_order_or_lexical_order() {
        let candidate = select_release(
            vec![
                release("0.9.0", false),
                release("0.10.0-beta.2", true),
                release("0.10.0-beta.11", true),
            ],
            &Version::parse("0.8.0").unwrap(),
        )
        .unwrap();
        assert_eq!(candidate.version.to_string(), "0.10.0-beta.11");
        assert!(candidate.release.prerelease);
    }

    #[test]
    fn stable_final_replaces_prerelease_but_never_downgrades() {
        let current = Version::parse("1.0.0-rc.2").unwrap();
        let candidate = select_release(
            vec![
                release("1.0.0-rc.1", true),
                release("0.9.0", false),
                release("1.0.0", false),
            ],
            &current,
        )
        .unwrap();
        assert_eq!(candidate.version, Version::parse("1.0.0").unwrap());
        assert!(!candidate.release.prerelease);
        assert!(select_release(
            vec![release("1.0.0-rc.2", true), release("0.9.0", false)],
            &current
        )
        .is_none());
    }

    #[test]
    fn github_flag_identifies_preview_even_with_numeric_version() {
        let candidate = select_release(
            vec![release("1.1.0", true)],
            &Version::parse("1.0.0").unwrap(),
        )
        .unwrap();
        assert!(candidate.release.prerelease);
        let candidate = select_release(
            vec![release("1.1.0-beta.1", false)],
            &Version::parse("1.0.0").unwrap(),
        )
        .unwrap();
        assert!(!candidate.release.prerelease);
    }

    #[test]
    fn skips_drafts_invalid_tags_and_unpublished_or_foreign_manifests() {
        let mut draft = release("2.0.0", true);
        draft.draft = true;
        let mut missing = release("3.0.0", true);
        missing.assets.clear();
        let mut foreign = release("4.0.0", true);
        foreign.assets[0].browser_download_url = "https://example.com/latest.json".into();
        let mut pending = release("5.0.0", true);
        pending.assets[0].state = "new".into();
        let mut empty = release("6.0.0", true);
        empty.assets[0].size = 0;
        assert!(select_release(
            vec![
                draft,
                missing,
                foreign,
                pending,
                empty,
                release("../latest", true)
            ],
            &Version::parse("1.0.0").unwrap()
        )
        .is_none());
    }

    #[test]
    fn build_metadata_is_not_a_new_version() {
        assert!(select_release(
            vec![release("1.0.0+new", true)],
            &Version::parse("1.0.0+old").unwrap()
        )
        .is_none());
    }

    #[test]
    fn accepts_only_signed_packages_from_the_selected_release() {
        let mut candidate = select_release(
            vec![release("1.1.0", true)],
            &Version::parse("1.0.0").unwrap(),
        )
        .unwrap();
        let url = Url::parse(&format!("{RELEASE_DOWNLOADS}v1.1.0/Lernwelt.app.tar.gz")).unwrap();
        assert!(validate_package("1.1.0", &url, "signature", Some(&candidate)).is_err());
        candidate.release.assets.push(ReleaseAsset {
            name: "Lernwelt.app.tar.gz".into(),
            state: "uploaded".into(),
            size: 1234,
            browser_download_url: url.to_string(),
        });
        assert!(validate_package("1.1.0", &url, "signature", Some(&candidate)).is_ok());
        assert!(validate_package("1.0.9", &url, "signature", Some(&candidate)).is_err());
        assert!(validate_package("1.1.0", &url, " ", Some(&candidate)).is_err());
        assert!(validate_package(
            "1.1.0",
            &Url::parse("https://example.com/app.tar.gz").unwrap(),
            "signature",
            None
        )
        .is_err());
        assert!(validate_package(
            "1.1.0",
            &Url::parse(&format!("{url}?override=true")).unwrap(),
            "signature",
            None
        )
        .is_err());
        assert!(validate_package("1.1.0", &url, "signature", None).is_ok());
    }

    #[test]
    fn exhausted_shared_budget_is_an_error() {
        assert!(remaining(Instant::now() - CHECK_TIMEOUT).is_err());
        assert!(remaining(Instant::now()).is_ok());
    }
}
