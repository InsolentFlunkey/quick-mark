use std::path::Path;

#[derive(Debug, serde::Serialize)]
pub struct Entry {
    name: String,
    kind: &'static str,
}

#[derive(Debug, serde::Serialize)]
pub struct Listing {
    entries: Vec<Entry>,
    truncated: bool,
}

fn list(
    document_path: &Path,
    directory: &str,
    prefix: &str,
    image: bool,
) -> Result<Listing, String> {
    if directory.len() > 4096 || prefix.len() > 255 || directory.contains(['?', '#']) {
        return Err("Unsupported completion path".into());
    }
    let directory = super::resolve_relative_target(document_path, directory)?;
    let reader = std::fs::read_dir(&directory)
        .map_err(|error| format!("Could not list {}: {error}", directory.display()))?;
    let prefix = prefix.to_lowercase();
    let mut entries = Vec::new();
    let mut truncated = false;
    // Bound filesystem work and IPC payload; never traverse recursively.
    for (index, entry) in reader.enumerate() {
        if index >= 10_000 {
            truncated = true;
            break;
        }
        let Ok(entry) = entry else { continue };
        let Ok(name) = entry.file_name().into_string() else {
            continue;
        };
        if !name.to_lowercase().starts_with(&prefix) {
            continue;
        }
        let Ok(target) = entry.path().canonicalize() else {
            continue;
        };
        let kind = if target.is_dir() {
            "directory"
        } else if target.is_file() && image && super::image_mime(&target).is_some() {
            "image"
        } else if target.is_file() && !image && super::is_supported_document(&target) {
            "document"
        } else {
            continue;
        };
        if entries.len() == 100 {
            truncated = true;
            break;
        }
        entries.push(Entry { name, kind });
    }
    entries.sort_by(|a, b| {
        (a.kind != "directory", a.name.to_lowercase(), &a.name).cmp(&(
            b.kind != "directory",
            b.name.to_lowercase(),
            &b.name,
        ))
    });
    Ok(Listing { entries, truncated })
}

#[tauri::command]
pub async fn list_path_completions(
    document_path: String,
    directory: String,
    prefix: String,
    image: bool,
) -> Result<Listing, String> {
    tauri::async_runtime::spawn_blocking(move || {
        list(Path::new(&document_path), &directory, &prefix, image)
    })
    .await
    .map_err(|error| format!("Directory lookup failed: {error}"))?
}

#[cfg(test)]
mod tests {
    use super::list;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicUsize, Ordering};
    static NEXT: AtomicUsize = AtomicUsize::new(0);

    struct Fixture(PathBuf);
    impl Fixture {
        fn new() -> Self {
            let root = std::env::temp_dir().join(format!(
                "quickmark-completion-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir_all(root.join("docs")).unwrap();
            fs::write(root.join("source.md"), "# Source\n").unwrap();
            Self(root)
        }
        fn source(&self) -> PathBuf {
            self.0.join("source.md")
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            fs::remove_dir_all(&self.0).unwrap();
        }
    }

    #[test]
    fn filters_by_resource_kind_and_sorts_directories_first() {
        let fixture = Fixture::new();
        for name in ["Guide.MD", "image.PNG", "other.svg", "app.exe", "notes.txt"] {
            fs::write(fixture.0.join(name), "fixture").unwrap();
        }
        let documents = list(&fixture.source(), ".", "", false).unwrap();
        assert_eq!(documents.entries[0].kind, "directory");
        assert!(documents
            .entries
            .iter()
            .any(|entry| entry.name == "Guide.MD" && entry.kind == "document"));
        assert!(!documents
            .entries
            .iter()
            .any(|entry| entry.name == "image.PNG" || entry.name == "app.exe"));
        let images = list(&fixture.source(), ".", "", true).unwrap();
        assert_eq!(images.entries.len(), 2);
        assert!(images
            .entries
            .iter()
            .any(|entry| entry.name == "image.PNG" && entry.kind == "image"));
        let matching = list(&fixture.source(), ".", "guI", false).unwrap();
        assert_eq!(matching.entries.len(), 1);
        assert_eq!(matching.entries[0].name, "Guide.MD");
    }

    #[test]
    fn resolves_nested_parent_encoded_and_unicode_directory_names() {
        let fixture = Fixture::new();
        let directory = fixture.0.join("Café # (100%)");
        fs::create_dir(&directory).unwrap();
        fs::write(directory.join("guide with spaces.md"), "fixture").unwrap();
        let result = list(
            &fixture.source(),
            "docs/../Caf%C3%A9%20%23%20%28100%25%29/",
            "guide",
            false,
        )
        .unwrap();
        assert_eq!(result.entries[0].name, "guide with spaces.md");
        fs::write(fixture.0.join("docs/child.md"), "fixture").unwrap();
        let parent = list(&fixture.0.join("docs/child.md"), "../", "source", false).unwrap();
        assert_eq!(parent.entries[0].name, "source.md");
    }

    #[test]
    fn rejects_unsupported_paths_and_handles_missing_empty_directories() {
        let fixture = Fixture::new();
        for directory in [
            "https://example.com",
            "file:///C:/",
            "//server/share",
            "C:/",
            "%2Fabsolute",
            "missing",
            "source.md",
            "docs#fragment",
        ] {
            assert!(
                list(&fixture.source(), directory, "", false).is_err(),
                "{directory}"
            );
        }
        assert!(list(&fixture.0.join("missing.md"), ".", "", false).is_err());
        fs::write(fixture.0.join("source.exe"), "fixture").unwrap();
        assert!(list(&fixture.0.join("source.exe"), ".", "", false).is_err());
        assert!(list(&fixture.source(), "docs", "", false)
            .unwrap()
            .entries
            .is_empty());
    }

    #[test]
    fn caps_results_and_allows_narrowing_the_prefix() {
        let fixture = Fixture::new();
        for index in 0..110 {
            fs::write(fixture.0.join(format!("file-{index:03}.md")), "fixture").unwrap();
        }
        let capped = list(&fixture.source(), ".", "file-", false).unwrap();
        assert_eq!(capped.entries.len(), 100);
        assert!(capped.truncated);
        let narrowed = list(&fixture.source(), ".", "file-109", false).unwrap();
        assert_eq!(narrowed.entries.len(), 1);
        assert!(!narrowed.truncated);
    }
}
