const visibilitySettings = (state = {}, action) => {
  switch (action.type) {
    case 'SET_VISIBILITY_FILTER':
      return { ...state, visibilityFilter: action.filter };
    case 'TOGGLE_MOVIELIST':
      return { ...state, showMovielist: !state.showMovielist };
    case 'SHOW_MOVIELIST':
      return { ...state, showMovielist: true };
    case 'HIDE_MOVIELIST':
      return { ...state, showMovielist: false };
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    case 'SHOW_SETTINGS':
      return { ...state, showSettings: true };
    case 'HIDE_SETTINGS':
      return { ...state, showSettings: false };
    case 'SET_VIEW':
      return { ...state, defaultView: action.defaultView };
    case 'SET_SHEETVIEW':
      return { ...state, defaultSheetView: action.defaultSheetView };
    case 'SET_ZOOMLEVEL':
      return { ...state, defaultZoomLevel: action.defaultZoomLevel };
    // case 'TOGGLE_ZOOM_OUT':
    //   return { ...state, zoomOut: !state.zoomOut };
    // case 'ZOOM_OUT':
    //   return { ...state, zoomOut: true };
    // case 'ZOOM_IN':
    //   return { ...state, zoomOut: false };
    default:
      return state;
  }
};

export default visibilitySettings;
