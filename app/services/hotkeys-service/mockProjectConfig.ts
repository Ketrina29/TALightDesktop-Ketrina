// mockProjectConfig.ts

export const mockProjectConfig = {
  HOTKEY_SAVE: { Control: true, Alt: false, Shift: false, Key: 's' },
  HOTKEY_EXPORT: { Control: true, Alt: false, Shift: false, Key: 'e' },
  HOTKEY_RUN: { Control: false, Alt: false, Shift: false, Key: 'F8' },
  HOTKEY_TEST: { Control: false, Alt: false, Shift: false, Key: 'F9' },

  // fusha të tjera të domosdoshme për ProjectConfig
  RUN: '',
  DEBUG: '',
  PROJECT_NAME: '',
  PREFERED_LANG: '',
  CONFIG_PATH: '',
  CONFIG_JSON: '',
  TUTORIAL_NAME: '',
  FILES: [],
  LANGUAGE: '',
  COMPILER: '',
  ARGUMENTS: '',
  EXECUTION: '',
  INPUT_FILES: [],
  OUTPUT_FILES: [],
  META_FILES: [],
  FILE_ASSOCIATION: [],
  HOTKEYS: [],
 
  parseFile: () => {},
  save: () => 'saved'
};
