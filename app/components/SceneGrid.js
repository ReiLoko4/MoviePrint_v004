// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, Popup } from 'semantic-ui-react';
import Scene from './Scene';
import styles from './SceneGrid.css';
import stylesApp from '../containers/App.css';
import stylesPop from './Popup.css';
import {
  getWidthOfSingleRow, getPreviousScenes, getNextScenes
} from '../utils/utils';
import {
  VIDEOPLAYER_FIXED_PIXEL_PER_FRAME_RATIO,
  VIDEOPLAYER_SCENE_MARGIN,
  VIEW,
  SHEET_TYPE,
} from '../utils/constants';

const SortableScene = SortableElement(Scene);

class SceneGrid extends Component {
  constructor(props) {
    super(props);

    this.state = {
      controllersVisible: undefined,
      scenesToDim: [],
    };

    this.resetHover = this.resetHover.bind(this);

  }

  componentWillMount() {
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }

  resetHover() {
    this.setState({
      scenesToDim: [],
      controllersVisible: undefined,
    });
  }

  render() {
    const { file, currentSheetId, minSceneLength, scaleValueObject, scenes, selectedThumbsArray, settings, sheetType, thumbs, view } = this.props;
    const { scenesInRows } = scaleValueObject;

    const isPlayerView = view !== VIEW.STANDARDVIEW;
    const breakOnWidth = isPlayerView || settings.defaultTimelineViewFlow;

    const thumbMarginTimeline = isPlayerView ? VIDEOPLAYER_SCENE_MARGIN : Math.floor(scaleValueObject.thumbMarginTimeline);

    const rowHeight = scaleValueObject.newMoviePrintTimelineRowHeight;
    const rowHeightForPlayer = ((scaleValueObject.videoPlayerHeight / 2) - (settings.defaultBorderMargin * 3));

    const realWidth = (rowHeight / scaleValueObject.aspectRatioInv);
    const realWidthForPlayer = (rowHeightForPlayer / scaleValueObject.aspectRatioInv);
    const newPixelPerFrameRatio = isPlayerView ? VIDEOPLAYER_FIXED_PIXEL_PER_FRAME_RATIO : scaleValueObject.newMoviePrintTimelinePixelPerFrameRatio; // set fixed pixel per frame ratio for player
    const indexRowArray = scenesInRows.map(item => item.index);

    // for VideoPlayer
    const widthOfSingleRow =
      getWidthOfSingleRow(
        scenes,
        thumbMarginTimeline,
        newPixelPerFrameRatio,
        minSceneLength)
      + realWidthForPlayer
      + thumbMarginTimeline;

    return (
      <div
        data-tid='sceneGridDiv'
        className={styles.grid}
        id="SceneGrid"
        style={{
          // paddingLeft: isPlayerView ? '48px' : undefined,
        }}
      >
        <div
          data-tid='sceneGridBodyDiv'
          style={{
            width: isPlayerView ? widthOfSingleRow : undefined, // if VideoPlayer then single row
          }}
        >
          {scenes.map((scene, index) => {
            // minutes per row idea
            const selected = selectedThumbsArray.length > 0 ? selectedThumbsArray.some(item => item.thumbId === scene.sceneId) : false;
            const rWidth = isPlayerView ? realWidthForPlayer : realWidth;
            const width = selected ? Math.floor(rWidth) :
              Math.floor(Math.max(newPixelPerFrameRatio * scene.length, newPixelPerFrameRatio * minSceneLength));
            // console.log(width);
            let doLineBreak = false;
            if (indexRowArray.findIndex(item => item === index - 1) > -1) {
              doLineBreak = true;
              // rowCounter += 1;
            }

            let thumb;
            if (thumbs !== undefined) {
              thumb = thumbs.find((foundThumb) => foundThumb.thumbId === scene.sceneId);
            }

            return (
            <SortableScene
              hidden={scene.hidden}
              controllersAreVisible={(scene.sceneId === undefined) ? false : (scene.sceneId === this.state.controllersVisible)}
              selected={selected}
              doLineBreak={!breakOnWidth && doLineBreak}
              sheetView={this.props.sheetView}
              view={view}
              keyObject={this.props.keyObject}
              indexForId={index}
              index={index}
              key={scene.sceneId}
              sceneId={scene.sceneId}
              margin={thumbMarginTimeline}
              dim={(this.state.scenesToDim.find((sceneToDim) => sceneToDim.sceneId === scene.sceneId))}

              // only allow expanding of scenes which are not already large enough and deselecting
              allowSceneToBeSelected={isPlayerView || selected || width < (realWidth * 0.95)}

              // use minimum value to make sure that scene does not disappear
              thumbWidth={Math.max(1, width)}
              thumbHeight={isPlayerView ? rowHeightForPlayer : Math.max(1, rowHeight)}

              hexColor={`#${((1 << 24) + (Math.round(scene.colorArray[0]) << 16) + (Math.round(scene.colorArray[1]) << 8) + Math.round(scene.colorArray[2])).toString(16).slice(1)}`}
              thumbImageObjectUrl={ // used for data stored in IndexedDB
                ((this.props.useBase64 === undefined &&
                  this.props.objectUrlObjects !== undefined &&
                  thumb !== undefined) ?
                  this.props.objectUrlObjects[thumb.frameId] : undefined)
              }
              base64={ // used for live captured data when saving movieprint
                ((this.props.useBase64 !== undefined &&
                  this.props.objectUrlObjects !== undefined &&
                  thumb !== undefined) ?
                  this.props.objectUrlObjects[thumb.frameId] : undefined)
              }


              onOver={() => {
                // only setState if controllersVisible has changed
                if (this.state.controllersVisible !== scene.sceneId) {
                  this.setState({
                    controllersVisible: scene.sceneId,
                  });
                }
              }}
              onOut={this.resetHover}
              onThumbDoubleClick={this.props.onThumbDoubleClick}
              onToggle={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => this.props.onToggleClick(file.id, scene.sceneId)}
              onHideBefore={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  const previousScenes = getPreviousScenes(scenes, scene.sceneId);
                  const previousSceneIds = previousScenes.map(s => s.sceneId);
                  this.props.onHideBeforeAfterClick(file.id, currentSheetId, previousSceneIds);
                  this.props.onDeselectClick();
                  this.resetHover();
                }}
              onHideAfter={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  const nextScenes = getNextScenes(scenes, scene.sceneId);
                  const nextSceneIds = nextScenes.map(s => s.sceneId);
                  this.props.onHideBeforeAfterClick(file.id, currentSheetId, nextSceneIds);
                  this.props.onDeselectClick();
                  this.resetHover();
                }}
              onHoverInPoint={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  const previousScenes = getPreviousScenes(scenes, scene.sceneId)
                  this.setState({
                    scenesToDim: getPreviousScenes(scenes, scene.sceneId)
                  });
                }}
              onHoverOutPoint={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.setState({
                    scenesToDim: getNextScenes(scenes, scene.sceneId)
                  });
                }}
              onLeaveInOut={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.setState({
                    scenesToDim: []
                  });
                }}
              onSelect={(scene.sceneId !== this.state.controllersVisible) ?
                null : (!isPlayerView && selected) ? () => {
                  this.props.onDeselectClick();
                } : () => {
                  this.props.onSelectClick(scene.sceneId, scene.start);
                }}
              onCutBefore={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.props.onJumpToCutSceneClick(file, scene.sceneId, 'before');
                }}
              onCutAfter={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.props.onJumpToCutSceneClick(file, scene.sceneId, 'after');
                }}
              onExpand={(scene.sceneId !== this.state.controllersVisible) ?
                null : () => {
                  this.props.onExpandClick(file, scene.sceneId, currentSheetId);
                }}
              inputRefThumb={(this.props.selectedThumbsArray.length !== 0 && this.props.selectedThumbsArray[0].thumbId === scene.sceneId) ?
                this.props.inputRefThumb : undefined} // for the thumb scrollIntoView function
            />)}
          )}
        </div>
      </div>
    );
  }
}

SceneGrid.defaultProps = {
  scenes: [],
  selectedThumbsArray: [],
  scenesToDim: [],
};

SceneGrid.propTypes = {
  scenes: PropTypes.array,
  selectedThumbsArray: PropTypes.array,
  scenesToDim: PropTypes.array,
};

const SortableSceneGrid = SortableContainer(SceneGrid);

export default SortableSceneGrid;
