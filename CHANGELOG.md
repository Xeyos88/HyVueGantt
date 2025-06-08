# Changelog

All notable changes to this project will be documented in this file.

---

## [v3.8.0](https://github.com/Xeyos88/HyVueGantt/tree/v3.8.0) (2025-06-04)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v3.7.0...v3.8.0)

**✨ New Features:**

- Bar definition event
- Connection label
- Different relation type for connections FS, FF, SS, SF

**📚 Documentation:**

- Update documentations

## [v3.7.0](https://github.com/Xeyos88/HyVueGantt/tree/v3.7.0) (2025-05-16)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v3.6.0...v3.7.0)

**✨ New Features:**

- Added holiday and event tooltip slots
- Base unit width for lower unit in timeaxis and default zoom level added as props
- Slot dedicated for bar in row group
- Slot dedicated for label in row group

**📚 Documentation:**

- Demo slots updated
- Slots documentation update

**🐛 Fix:**

- Timeaxis event slot

## [v3.6.0](https://github.com/Xeyos88/HyVueGantt/tree/v3.6.0) (2025-05-01)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v3.5.0...v3.6.0)

**✨ New Features:**

- Import data from file

## [v3.5.0](https://github.com/Xeyos88/HyVueGantt/tree/v3.5.0) (2025-04-03)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v3.4.0...v3.5.0)

**✨ New Features:**

- Export Gantt in: pdf, png, svg and excel

**📚 Documentation:**

- Update documentation

## [v3.4.0](https://github.com/Xeyos88/HyVueGantt/tree/v3.4.0) (2025-03-14)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v3.3.0...v3.4.0)

**✨ New Features:**

- change tooltip position depending on chart position on page
- Events time axis
- MVP pointer marker

**🐛 Fix:**

- Mismatched variable name

## [v3.3.0](https://github.com/Xeyos88/HyVueGantt/tree/v3.3.0) (2025-02-26)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v3.1.2...v3.3.0)

**✨ New Features:**

- Bar label editable

**🐛 Fix:**

- conflict when using uuid with, the ID is sanitized without harming the data

## [v3.1.2](https://github.com/Xeyos88/HyVueGantt/tree/v3.1.2) (2025-02-24)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v3.1.1...v3.1.2)

**🐛 Fix:**

- Creation connection with group bars

## [v3.1.1](https://github.com/Xeyos88/HyVueGantt/tree/v3.1.1) (2025-02-17)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v3.1.0...v3.1.1)

**🐛 Fix:**

- Interaction with progress with active connection drawing

## [v3.1.0](https://github.com/Xeyos88/HyVueGantt/tree/v3.1.0) (2025-02-15)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v3.0.0...v3.1.0)

**✨ New Features:**

- Deletion of connetions
- Percentage progress for bar
- Runtime connection creation
- UTC support for current time

## [v3.0.0](https://github.com/Xeyos88/HyVueGantt/tree/v3.0.0) (2025-01-31)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v2.2.0...v3.0.0)

**📚 Documentation:**

- Advanced demo slots
- Advanced Gantt Demo
- fix some docs
- Update changelog

**⚠ BREAKING CHANGES:**

- The commands slot now totally replaces the command area, exposing all useful methods

**🐛 Fix:**

- Chart and label misalignment with timeaxis hide
- Expand and Collapse all buttons disabled status
- Reactivity of defaultConnections props
- Reactivity of enableMinutes prop
- Reactivity of enableRowDragAndDrop prop
- Reactivity of labelResizable prop
- Reactivity of locale and holiday props
- Reactivity of precision prop
- Reactivity of sortable prop

**✨ New Features:**

- History managment by keyboard
- History mode, undo and redo of actions
- Label column section resizable
- With grouped rows the commands now contain the functions expand all or collapse all

## [v2.2.0](https://github.com/Xeyos88/HyVueGantt/tree/v2.2.0) (2025-01-25)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v2.1.0...v2.2.0)

**🐛 Fix:**

- added uuid package for cryopto replacement
- Bundle movement for bars in groups
- pushOnOverlap and pushOnConnect for bars in group

**✨ New Features:**

- Gantt connections with bar groups
- Marker connection definition. 3 types none, bidirectional and forward
- Mobile event support

## [v2.1.0](https://github.com/Xeyos88/HyVueGantt/tree/v2.1.0) (2025-01-21)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v2.0.0...v2.1.0)

**✨ New Features:**

- Drag and drop rows

## [v2.0.0](https://github.com/Xeyos88/HyVueGantt/tree/v2.0.0) (2025-01-15)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v1.6.0...v2.0.0)

**Features:**

- Added slot for column label row value

**Bug Fixes:**

- border, interaction between grid and hover on highlight
- Exposed event interface
- Slot label-column-title
- Update positions of bar connections with groups

## [v1.6.0](https://github.com/Xeyos88/HyVueGantt/tree/v1.6.0) (2025-01-11)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v1.5.0...v1.6.0)

**Features:**

- Row grouping

**Bug Fixes:**

- sort for rows children
- Sorting problem

## [v1.5.0](https://github.com/Xeyos88/HyVueGantt/tree/v1.5.0) (2025-01-02)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v1.4.0...v1.5.0)

**New Features:**

- added different modes to highlight different vertical grid units
- Added localization for timeaxis

**Bug Fixes:**

- Corrected bar management in case of multiple Gantt
- Corrected the functionality of the initial sorting property
- **grid:** Grid visualization with minutes

## [v1.4.0](https://github.com/Xeyos88/HyVueGantt/tree/v1.4.0) (2024-12-31)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v1.3.0...v1.4.0)

**New Features:**

- release/1.4.0 - Refactoring release process and added test

## [v1.3.0](https://github.com/Xeyos88/HyVueGantt/tree/v1.3.0) (2024-12-29)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v1.2.0...v1.3.0)

**New Features:**

- Added milestone slots support. #milestone for all milestones, #milestone-${milestoneId} for specific milestone
- Added milestone definition per bar. Bars cannot exceed the milestone
- Added rowClass and rowLabelClass props. Custom methods to add classes in the data row and label row
- Added dayOptionLabel prop. Define different ways to visualize the day time unit (number, day, doy or name)

**Updates:**

- Added id field in Milestone type

**Fixed:**

- Fixed bar slot propagation
- Fixed sort event emit
- User precision is now the best displayed precision

## [v1.2.0](https://github.com/Xeyos88/HyVueGantt/tree/v1.2.0) (2024-12-25)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v1.1.0...v1.2.0)

**New Features:**

- Milestone definition with tooltip and color schema
- Enable holiday highlight with tooltip and color schema

**Updates:**

- Auto change of precision if lower cells become too small for proper display
- Improved zoom feature

**Fixed:**

- Fixed bar connection after zoom

## [v1.1.0](https://github.com/Xeyos88/HyVueGantt/tree/v1.1.0) (2024-12-22)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v1.0.1...v1.1.0)

**New Features:**

- Use multiple label columns pre-defined
- Sort rows based on label column
- Resizable label columns
- Define custom label columns

**Note:**

All features above are enabled with `labelColumnTitle` prop defined

## [v1.0.1](https://github.com/Xeyos88/HyVueGantt/tree/v1.0.1) (2024-12-19)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v1.00...v1.0.1)

**Fixed bugs:**

- Update bar connection position with hidden rows

## [v1.0.0](https://github.com/Xeyos88/HyVueGantt/tree/v1.0.0) (2024-12-19)

**First version**

- Feature: Complete TypeScript support with enhanced type definitions and inference
- Feature: Bars support connections with multiple styles ('bezier', 'straight', 'squared') and patterns ('solid', 'dot', 'dash', 'dashdot')
- Feature: Built-in keyboard navigation with arrow keys for bar movement and resizing
- Feature: 11 pre-built color schemes with consistent theming across components
- Feature: `pushOnConnect` props for controlling bar behavior during drag operations
- Feature: Responsive zoom controls with customizable steps and limits
- Feature: Support for bar bundles to group and move related bars together
- Fix: Bar position calculation improved for better accuracy
- Fix: Memory leak in resize observer properly handled
- Fix: Edge cases in bar overlap detection resolved
- Fix: Time axis rendering optimization for large datasets
