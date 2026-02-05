// mapping of version-specific imports to fix
// Each line is: "old import" -> "new import"
const replacements = [
  // @radix-ui packages with versions
  ['from "@radix-ui/react-slot@1.1.2"', 'from "@radix-ui/react-slot"'],
  ['from "@radix-ui/react-checkbox@1.1.4"', 'from "@radix-ui/react-checkbox"'],
  ['from "@radix-ui/react-context-menu@2.2.6"', 'from "@radix-ui/react-context-menu"'],
  ['from "@radix-ui/react-dialog@1.1.6"', 'from "@radix-ui/react-dialog"'],
  ['from "@radix-ui/react-dropdown-menu@2.1.6"', 'from "@radix-ui/react-dropdown-menu"'],
  ['from "@radix-ui/react-label@2.1.2"', 'from "@radix-ui/react-label"'],
  ['from "@radix-ui/react-menubar@1.1.6"', 'from "@radix-ui/react-menubar"'],
  ['from "@radix-ui/react-navigation-menu@1.2.5"', 'from "@radix-ui/react-navigation-menu"'],
  ['from "@radix-ui/react-popover@1.1.6"', 'from "@radix-ui/react-popover"'],
  ['from "@radix-ui/react-radio-group@1.2.3"', 'from "@radix-ui/react-radio-group"'],
  ['from "@radix-ui/react-scroll-area@1.2.3"', 'from "@radix-ui/react-scroll-area"'],
  ['from "@radix-ui/react-separator@1.1.2"', 'from "@radix-ui/react-separator"'],
  ['from "@radix-ui/react-slider@1.2.3"', 'from "@radix-ui/react-slider"'],
  ['from "@radix-ui/react-switch@1.1.3"', 'from "@radix-ui/react-switch"'],
  ['from "@radix-ui/react-tabs@1.1.3"', 'from "@radix-ui/react-tabs"'],
  ['from "@radix-ui/react-toggle-group@1.1.2"', 'from "@radix-ui/react-toggle-group"'],
  ['from "@radix-ui/react-toggle@1.1.2"', 'from "@radix-ui/react-toggle"'],
  ['from "@radix-ui/react-tooltip@1.1.8"', 'from "@radix-ui/react-tooltip"'],
  
  // Additional missed ones
  ['from "@radix-ui/react-select@2.1.6"', 'from "@radix-ui/react-select"'],
  ['from "@radix-ui/react-progress@1.1.2"', 'from "@radix-ui/react-progress"'],
  ['from "@radix-ui/react-hover-card@1.1.6"', 'from "@radix-ui/react-hover-card"'],
  ['from "@radix-ui/react-collapsible@1.1.3"', 'from "@radix-ui/react-collapsible"'],
  ['from "@radix-ui/react-avatar@1.1.3"', 'from "@radix-ui/react-avatar"'],
  ['from "@radix-ui/react-aspect-ratio@1.1.2"', 'from "@radix-ui/react-aspect-ratio"'],
  ['from "@radix-ui/react-alert-dialog@1.1.6"', 'from "@radix-ui/react-alert-dialog"'],
  ['from "@radix-ui/react-accordion@1.2.3"', 'from "@radix-ui/react-accordion"'],
  
  // Other packages
  ['from "class-variance-authority@0.7.1"', 'from "class-variance-authority"'],
  ['from "cmdk@1.1.1"', 'from "cmdk"'],
];

module.exports = replacements;
