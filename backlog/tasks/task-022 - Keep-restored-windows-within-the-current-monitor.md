---
id: TASK-022
title: Keep restored windows within the current monitor
status: Done
assignee:
  - Codex
created_date: '2026-09-04 14:49'
updated_date: '2026-09-04 15:56'
labels:
  - bug
  - windows
  - desktop
dependencies: []
references:
  - >-
    https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/window-state/src/lib.rs
  - 'https://github.com/tauri-apps/plugins-workspace/issues/2620'
modified_files:
  - src-tauri/Cargo.lock
  - src-tauri/Cargo.toml
  - src-tauri/src/lib.rs
  - src-tauri/src/window_geometry.rs
priority: high
type: bug
ordinal: 22100
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Correct QuickMark’s window-state restoration when persisted physical dimensions are invalid, incorrectly scaled, or larger than the available display. QuickMark currently has a saved main-window size of 4498 × 4800 pixels and restores it without a usable monitor-bound size, despite the window-state plugin being installed. Preserve valid remembered geometry while recovering safely from oversized or stale state for main and reference windows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A restored QuickMark window never opens wider or taller than the usable current display
- [x] #2 Valid remembered size and position continue to survive a normal close and relaunch
- [x] #3 Oversized, corrupt, stale-monitor, and incorrectly scaled saved geometry recover to a usable bounded size instead of compounding across launches
- [x] #4 Main, README, and Markdown Examples windows follow the same safe restoration rules
- [x] #5 First launch without saved state retains sensible default and minimum dimensions
- [x] #6 Automated geometry/state tests plus native verification cover valid restoration, oversized saved state, display changes, and repeated relaunches
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a small desktop-only window-geometry module with pure rectangle/monitor selection and clamping logic. Treat persisted sizes as physical inner dimensions, select the saved monitor by usable-work-area overlap (falling back to the primary/first monitor), bound oversized dimensions with a conservative frame allowance, and relocate stale positions into that work area.
2. Register a pre-restore Tauri plugin before tauri-plugin-window-state to sanitize only the geometry fields in .window-state.json while preserving valid state and unrelated fields. Leave missing/corrupt state for the existing plugin’s normal default recovery.
3. Register a post-restore Tauri plugin after tauri-plugin-window-state to compare the real outer window frame with the selected monitor work area and make any final size/position correction. Apply it automatically to main, readme, examples, and future desktop windows; retain the existing state plugin for normal persistence.
4. Add focused Rust tests for unchanged valid geometry, oversized/incorrectly-scaled state, stale monitor positions, corrupt state, monitor selection, frame-aware post-restore calculations, and idempotent repeated sanitization.
5. Run the Rust, frontend, and build checks, then perform native relaunch verification against valid and deliberately oversized saved state before evaluating every acceptance criterion.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation research: tauri-plugin-window-state 2.4.1 stores/restores physical inner dimensions and restores saved size without bounding it to Monitor::work_area(). Its existing monitor-intersection check protects only position restoration. Tauri calls plugin setup and window-ready hooks in registration order.

Implemented two-stage desktop protection around the existing plugin: pre-restore JSON geometry sanitization with monitor selection/fallback and conservative frame allowance, followed by a post-restore correction using the actual outer/inner frame. The existing plugin remains responsible for ordinary size/position persistence.

Automated verification currently passes: 18 Rust tests, 163 frontend tests, and npm production build. cargo-clippy could not be run because the clippy component is not installed in the active Rust toolchain; no installation or workaround was attempted.

Native oversized-state verification started from the existing 4498 × 4800 main geometry. On launch the persisted height was bounded to 2916 for a 2980-pixel usable display height; awaiting visual confirmation and normal close/relaunch checks.

Native verification gotcha: running plain cargo build overwrites target/debug/quick-mark with a development-config binary that loads devUrl (localhost:1420), producing “Could not connect to localhost” without Vite. Rebuilt the directly launchable debug executable with npm run tauri -- build --debug --no-bundle so the frontend is embedded.

Native verification completed: the packaged app recovered from the previously oversized state, the main and reference windows remained contained, and a second close/relaunch stayed contained without visual scaling compounding. The user deliberately increased the main window height during the second run; the resulting persisted height change is expected user state rather than restoration drift.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added desktop window-state validation around tauri-plugin-window-state so persisted geometry is bounded to a current monitor’s usable work area before restoration and checked again against the actual decorated window frame afterward. Valid state remains under the existing plugin’s persistence model, while oversized, incorrectly scaled, and stale-monitor coordinates are recovered consistently for main, README, Markdown Examples, and future desktop windows.

Added pure Rust coverage for valid-state preservation, oversized geometry, idempotent repeated sanitization, multi-monitor selection, stale positions, corrupt/incomplete state, first-launch state, all named windows, and frame-aware post-restore correction. Verification passed with 18 Rust tests, 163 frontend tests, a production frontend build, a Tauri embedded-frontend debug build, and two native close/relaunch checks starting from the oversized saved state. Clippy was not available in the installed Rust toolchain.
<!-- SECTION:FINAL_SUMMARY:END -->
