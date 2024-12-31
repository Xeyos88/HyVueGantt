# Changelog

All notable changes to this project will be documented in this file.

---

## [v1.4.0](https://github.com/Xeyos88/HyVueGantt/tree/v1.4.0) (2024-12-31)

[Full Changelog](https://github.com/Xeyos88/HyVueGantt/compare/v1.3.0...v1.4.0)


### Features

- 'release/1.4.0 - Refactoring release process and added test'

# Changelog

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
