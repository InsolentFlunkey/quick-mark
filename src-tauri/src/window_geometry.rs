use serde_json::Value;
use std::fs;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, PhysicalPosition, PhysicalSize, Runtime, Window,
};

const WINDOW_STATE_FILENAME: &str = ".window-state.json";
const FRAME_WIDTH_ALLOWANCE: u32 = 32;
const FRAME_HEIGHT_ALLOWANCE: u32 = 64;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct Bounds {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct WindowCorrection {
    inner_width: u32,
    inner_height: u32,
    x: i32,
    y: i32,
}

impl Bounds {
    fn right(self) -> i64 {
        i64::from(self.x) + i64::from(self.width)
    }

    fn bottom(self) -> i64 {
        i64::from(self.y) + i64::from(self.height)
    }

    fn contains(self, x: i32, y: i32) -> bool {
        i64::from(x) >= i64::from(self.x)
            && i64::from(x) < self.right()
            && i64::from(y) >= i64::from(self.y)
            && i64::from(y) < self.bottom()
    }

    fn overlap_area(self, other: Self) -> u64 {
        let width = (self.right().min(other.right()) - i64::from(self.x).max(i64::from(other.x)))
            .max(0) as u64;
        let height = (self.bottom().min(other.bottom()) - i64::from(self.y).max(i64::from(other.y)))
            .max(0) as u64;
        width.saturating_mul(height)
    }
}

fn monitor_for_rect<'a>(
    rect: Bounds,
    monitors: &'a [Bounds],
    primary: Option<Bounds>,
) -> Option<&'a Bounds> {
    monitors
        .iter()
        .find(|monitor| monitor.contains(rect.x, rect.y))
        .or_else(|| {
            monitors
                .iter()
                .map(|monitor| (monitor, monitor.overlap_area(rect)))
                .filter(|(_, area)| *area > 0)
                .max_by_key(|(_, area)| *area)
                .map(|(monitor, _)| monitor)
        })
        .or_else(|| {
            primary.and_then(|primary| monitors.iter().find(|monitor| **monitor == primary))
        })
        .or_else(|| monitors.first())
}

fn clamp_position(position: i32, extent: u32, start: i32, available: u32) -> i32 {
    let maximum =
        (i64::from(start) + i64::from(available) - i64::from(extent)).max(i64::from(start));
    i64::from(position)
        .clamp(i64::from(start), maximum)
        .clamp(i64::from(i32::MIN), i64::from(i32::MAX)) as i32
}

fn sanitize_rect(rect: Bounds, monitors: &[Bounds], primary: Option<Bounds>) -> Option<Bounds> {
    let monitor = *monitor_for_rect(rect, monitors, primary)?;
    let maximum_width = monitor.width.saturating_sub(FRAME_WIDTH_ALLOWANCE).max(1);
    let maximum_height = monitor.height.saturating_sub(FRAME_HEIGHT_ALLOWANCE).max(1);
    let width = rect.width.clamp(1, maximum_width);
    let height = rect.height.clamp(1, maximum_height);
    let outer_width = width
        .saturating_add(FRAME_WIDTH_ALLOWANCE)
        .min(monitor.width);
    let outer_height = height
        .saturating_add(FRAME_HEIGHT_ALLOWANCE)
        .min(monitor.height);

    Some(Bounds {
        x: clamp_position(rect.x, outer_width, monitor.x, monitor.width),
        y: clamp_position(rect.y, outer_height, monitor.y, monitor.height),
        width,
        height,
    })
}

fn correct_actual_geometry(outer: Bounds, inner: Bounds, work_area: Bounds) -> WindowCorrection {
    let width_overage = outer.width.saturating_sub(work_area.width);
    let height_overage = outer.height.saturating_sub(work_area.height);
    let corrected_outer_width = outer.width.min(work_area.width);
    let corrected_outer_height = outer.height.min(work_area.height);

    WindowCorrection {
        inner_width: inner.width.saturating_sub(width_overage).max(1),
        inner_height: inner.height.saturating_sub(height_overage).max(1),
        x: clamp_position(outer.x, corrected_outer_width, work_area.x, work_area.width),
        y: clamp_position(
            outer.y,
            corrected_outer_height,
            work_area.y,
            work_area.height,
        ),
    }
}

fn integer(object: &serde_json::Map<String, Value>, key: &str) -> Option<i64> {
    object.get(key)?.as_i64()
}

fn sanitize_window_state(state: &mut Value, monitors: &[Bounds], primary: Option<Bounds>) -> bool {
    let Some(windows) = state.as_object_mut() else {
        return false;
    };
    let mut changed = false;

    for window in windows.values_mut() {
        let Some(object) = window.as_object_mut() else {
            continue;
        };
        let (Some(width), Some(height), Some(x), Some(y)) = (
            integer(object, "width").and_then(|value| u32::try_from(value).ok()),
            integer(object, "height").and_then(|value| u32::try_from(value).ok()),
            integer(object, "x").and_then(|value| i32::try_from(value).ok()),
            integer(object, "y").and_then(|value| i32::try_from(value).ok()),
        ) else {
            continue;
        };
        let original = Bounds {
            x,
            y,
            width,
            height,
        };
        let Some(sanitized) = sanitize_rect(original, monitors, primary) else {
            continue;
        };

        for (key, value) in [
            ("width", i64::from(sanitized.width)),
            ("height", i64::from(sanitized.height)),
            ("x", i64::from(sanitized.x)),
            ("y", i64::from(sanitized.y)),
        ] {
            if integer(object, key) != Some(value) {
                object.insert(key.to_string(), Value::from(value));
                changed = true;
            }
        }

        for (x_key, y_key) in [("prev_x", "prev_y")] {
            let (Some(previous_x), Some(previous_y)) = (
                integer(object, x_key).and_then(|value| i32::try_from(value).ok()),
                integer(object, y_key).and_then(|value| i32::try_from(value).ok()),
            ) else {
                continue;
            };
            let previous = Bounds {
                x: previous_x,
                y: previous_y,
                width: sanitized.width,
                height: sanitized.height,
            };
            if let Some(sanitized_previous) = sanitize_rect(previous, monitors, primary) {
                for (key, value) in [
                    (x_key, i64::from(sanitized_previous.x)),
                    (y_key, i64::from(sanitized_previous.y)),
                ] {
                    if integer(object, key) != Some(value) {
                        object.insert(key.to_string(), Value::from(value));
                        changed = true;
                    }
                }
            }
        }
    }

    changed
}

fn monitor_bounds(monitors: &[tauri::Monitor]) -> Vec<Bounds> {
    monitors
        .iter()
        .map(|monitor| {
            let work_area = monitor.work_area();
            Bounds {
                x: work_area.position.x,
                y: work_area.position.y,
                width: work_area.size.width,
                height: work_area.size.height,
            }
        })
        .collect()
}

fn primary_bounds(primary: Option<&tauri::Monitor>) -> Option<Bounds> {
    let work_area = primary?.work_area();
    Some(Bounds {
        x: work_area.position.x,
        y: work_area.position.y,
        width: work_area.size.width,
        height: work_area.size.height,
    })
}

fn sanitize_saved_window_state<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let state_path = app.path().app_config_dir()?.join(WINDOW_STATE_FILENAME);
    let Ok(contents) = fs::read(&state_path) else {
        return Ok(());
    };
    let Ok(mut state) = serde_json::from_slice::<Value>(&contents) else {
        return Ok(());
    };
    let available_monitors = app.available_monitors()?;
    let monitors = monitor_bounds(&available_monitors);
    let primary_monitor = app.primary_monitor()?;

    if sanitize_window_state(
        &mut state,
        &monitors,
        primary_bounds(primary_monitor.as_ref()),
    ) {
        fs::write(state_path, serde_json::to_vec_pretty(&state)?)?;
    }
    Ok(())
}

fn fit_window_to_work_area<R: Runtime>(window: &Window<R>) -> tauri::Result<()> {
    if window.is_maximized()? || window.is_fullscreen()? {
        return Ok(());
    }

    let outer = window.outer_size()?;
    let inner = window.inner_size()?;
    let position = window.outer_position()?;
    let available_monitors = window.available_monitors()?;
    let monitors = monitor_bounds(&available_monitors);
    let primary_monitor = window.primary_monitor()?;
    let current = Bounds {
        x: position.x,
        y: position.y,
        width: outer.width,
        height: outer.height,
    };
    let Some(work_area) =
        monitor_for_rect(current, &monitors, primary_bounds(primary_monitor.as_ref()))
    else {
        return Ok(());
    };

    let correction = correct_actual_geometry(
        current,
        Bounds {
            x: position.x,
            y: position.y,
            width: inner.width,
            height: inner.height,
        },
        *work_area,
    );
    let corrected_inner = PhysicalSize {
        width: correction.inner_width,
        height: correction.inner_height,
    };
    if corrected_inner != inner {
        window.set_size(corrected_inner)?;
    }

    let corrected_position = PhysicalPosition {
        x: correction.x,
        y: correction.y,
    };
    if corrected_position != position {
        window.set_position(corrected_position)?;
    }
    Ok(())
}

pub fn sanitizer_plugin<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("window-state-sanitizer")
        .setup(|app, _api| {
            if let Err(error) = sanitize_saved_window_state(app) {
                eprintln!("Could not sanitize saved window state: {error}");
            }
            Ok(())
        })
        .build()
}

pub fn bounds_plugin<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("window-bounds")
        .on_window_ready(|window| {
            if let Err(error) = fit_window_to_work_area(&window) {
                eprintln!("Could not fit window to the current display: {error}");
            }
        })
        .build()
}

#[cfg(test)]
mod tests {
    use super::{
        correct_actual_geometry, sanitize_window_state, Bounds, WindowCorrection,
        FRAME_HEIGHT_ALLOWANCE, FRAME_WIDTH_ALLOWANCE,
    };
    use serde_json::json;

    const PRIMARY: Bounds = Bounds {
        x: 0,
        y: 0,
        width: 1920,
        height: 1040,
    };

    const SECONDARY: Bounds = Bounds {
        x: 1920,
        y: 0,
        width: 1280,
        height: 984,
    };

    fn state(width: i64, height: i64, x: i64, y: i64) -> serde_json::Value {
        json!({
            "main": {
                "width": width,
                "height": height,
                "x": x,
                "y": y,
                "prev_x": x,
                "prev_y": y,
                "maximized": false,
                "visible": true,
                "decorated": true,
                "fullscreen": false
            }
        })
    }

    #[test]
    fn preserves_valid_geometry_and_unknown_fields() {
        let mut value = state(1100, 760, 200, 100);
        value["main"]["future_field"] = json!("preserved");

        assert!(!sanitize_window_state(
            &mut value,
            &[PRIMARY],
            Some(PRIMARY)
        ));
        assert_eq!(value["main"]["width"], 1100);
        assert_eq!(value["main"]["x"], 200);
        assert_eq!(value["main"]["future_field"], "preserved");
    }

    #[test]
    fn bounds_oversized_geometry_and_is_idempotent() {
        let mut value = state(4498, 4800, 0, 0);

        assert!(sanitize_window_state(&mut value, &[PRIMARY], Some(PRIMARY)));
        assert_eq!(
            value["main"]["width"],
            PRIMARY.width - FRAME_WIDTH_ALLOWANCE
        );
        assert_eq!(
            value["main"]["height"],
            PRIMARY.height - FRAME_HEIGHT_ALLOWANCE
        );
        assert_eq!(value["main"]["x"], PRIMARY.x);
        assert_eq!(value["main"]["y"], PRIMARY.y);
        assert!(!sanitize_window_state(
            &mut value,
            &[PRIMARY],
            Some(PRIMARY)
        ));
    }

    #[test]
    fn keeps_geometry_on_the_monitor_containing_its_origin() {
        let mut value = state(1000, 700, 2000, 100);

        assert!(!sanitize_window_state(
            &mut value,
            &[PRIMARY, SECONDARY],
            Some(PRIMARY)
        ));
        assert_eq!(value["main"]["x"], 2000);
    }

    #[test]
    fn relocates_stale_current_and_previous_positions_to_primary_monitor() {
        let mut value = state(1000, 700, 6000, -4000);

        assert!(sanitize_window_state(
            &mut value,
            &[PRIMARY, SECONDARY],
            Some(PRIMARY)
        ));
        assert_eq!(value["main"]["x"], 888);
        assert_eq!(value["main"]["y"], PRIMARY.y);
        assert_eq!(value["main"]["prev_x"], 888);
        assert_eq!(value["main"]["prev_y"], PRIMARY.y);
    }

    #[test]
    fn ignores_corrupt_or_incomplete_state_without_replacing_it() {
        for mut value in [json!("not an object"), json!({"main": {"width": "wide"}})] {
            let original = value.clone();
            assert!(!sanitize_window_state(
                &mut value,
                &[PRIMARY],
                Some(PRIMARY)
            ));
            assert_eq!(value, original);
        }
    }

    #[test]
    fn leaves_first_launch_state_empty() {
        let mut value = json!({});

        assert!(!sanitize_window_state(
            &mut value,
            &[PRIMARY],
            Some(PRIMARY)
        ));
        assert_eq!(value, json!({}));
    }

    #[test]
    fn corrects_for_the_real_window_frame_after_restore() {
        let correction = correct_actual_geometry(
            Bounds {
                x: -20,
                y: 20,
                width: 1940,
                height: 1060,
            },
            Bounds {
                x: -20,
                y: 20,
                width: 1920,
                height: 1020,
            },
            PRIMARY,
        );

        assert_eq!(
            correction,
            WindowCorrection {
                inner_width: 1900,
                inner_height: 1000,
                x: 0,
                y: 0,
            }
        );
    }

    #[test]
    fn post_restore_check_preserves_valid_actual_geometry() {
        let correction = correct_actual_geometry(
            Bounds {
                x: 200,
                y: 100,
                width: 1120,
                height: 800,
            },
            Bounds {
                x: 200,
                y: 100,
                width: 1100,
                height: 760,
            },
            PRIMARY,
        );

        assert_eq!(
            correction,
            WindowCorrection {
                inner_width: 1100,
                inner_height: 760,
                x: 200,
                y: 100,
            }
        );
    }

    #[test]
    fn sanitizes_each_named_window_with_the_same_rules() {
        let mut value = json!({
            "main": state(4498, 4800, 0, 0)["main"].clone(),
            "readme": state(4498, 4800, 0, 0)["main"].clone(),
            "examples": state(4498, 4800, 0, 0)["main"].clone()
        });

        assert!(sanitize_window_state(&mut value, &[PRIMARY], Some(PRIMARY)));
        for label in ["main", "readme", "examples"] {
            assert_eq!(value[label]["width"], PRIMARY.width - FRAME_WIDTH_ALLOWANCE);
            assert_eq!(
                value[label]["height"],
                PRIMARY.height - FRAME_HEIGHT_ALLOWANCE
            );
        }
    }
}
