import * as React from "react"
import AnnotationLayer from "./AnnotationLayer"
import InteractionLayer from "./InteractionLayer"
import VisualizationLayer from "./VisualizationLayer"
import { generateFrameTitle } from "./svg/frameFunctions"
import { drawMarginPath } from "./svg/frameFunctions"
import { filterDefs } from "./constants/jsx"

import SpanOrDiv from "./SpanOrDiv"
import { MarginType } from "./types/generalTypes"
import { AxisProps, AnnotationHandling } from "./types/annotationTypes"
import { LegendProps } from "./types/legendTypes"
import { ScaleLinear } from "d3-scale"

type VizDataLayerKeys =
  | "pieces"
  | "summaries"
  | "connectors"
  | "edges"
  | "nodes"
  | "areas"
  | "lines"
  | "points"

type Props = {
  name?: string
  title: object
  margin: MarginType
  size: Array<number>
  annotationSettings: AnnotationHandling
  annotations?: Array<object>
  customHoverBehavior?: Function
  customClickBehavior?: Function
  customDoubleClickBehavior?: Function
  htmlAnnotationRules?: Function
  tooltipContent?: Function
  className?: string
  interaction?: object
  renderFn?: string | Function
  hoverAnnotation?: boolean | object | Array<object | Function> | Function
  backgroundGraphics?: React.ReactNode | Function
  foregroundGraphics?: React.ReactNode | Function
  interactionOverflow?: object
  disableContext?: boolean
  canvasRendering?: boolean
  useSpans: boolean
  baseMarkProps?: object
  canvasPostProcess?: "chuckClose" | Function
  projection?: string
  rScale?: ScaleLinear<number, number>
  columns?: object
  overlay?: Array<object>
  legendSettings?: LegendProps
  adjustedPosition: Array<number>
  defaultHTMLRule: Function
  defaultSVGRule: Function
  downloadButton: React.ReactNode
  beforeElements?: React.ReactNode
  afterElements?: React.ReactNode
  points?: Array<object>
  projectedYMiddle?: string
  dataVersion?: string
  frameKey?: string
  additionalDefs?: React.ReactNode
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
  adjustedSize?: Array<number>
  renderPipeline: { [key in VizDataLayerKeys]?: object }
  projectedCoordinateNames: { x: string; y: string }
  matte?: boolean | object | Element | Function
  axes?: Array<React.ReactNode>
  axesTickLines?: React.ReactNode
  disableCanvasInteraction?: boolean
  showLinePoints?: string
  renderOrder: ReadonlyArray<VizDataLayerKeys>
}

type State = {
  canvasContext?: { getContext: Function }
  voronoiHover?: object
}

const defaultZeroMargin = { top: 0, bottom: 0, left: 0, right: 0 }

class Frame extends React.Component<Props, State> {
  static defaultProps = {
    annotationSettings: {},
    adjustedPosition: [0, 0],
    projectedCoordinateNames: { x: "x", y: "y" },
    renderOrder: []
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      canvasContext: null,
      voronoiHover: undefined
    }
  }

  canvasContext = null

  componentDidMount() {
    this.setState({
      canvasContext: this.canvasContext
    })
  }

  componentDidUpdate() {
    if (this.canvasContext !== this.state.canvasContext)
      this.setState({
        canvasContext: this.canvasContext
      })
  }

  setVoronoi = (d: Object) => {
    this.setState({ voronoiHover: d })
  }

  render() {
    const {
      axes,
      axesTickLines,
      className = "",
      matte,
      name = "",
      frameKey,
      projectedCoordinateNames,
      renderPipeline,
      size,
      adjustedSize = size,
      title,
      xScale,
      yScale,
      dataVersion,
      annotations,
      hoverAnnotation,
      projectedYMiddle,
      interaction,
      customClickBehavior,
      customHoverBehavior,
      customDoubleClickBehavior,
      points,
      margin = defaultZeroMargin,
      backgroundGraphics,
      foregroundGraphics,
      beforeElements,
      afterElements,
      downloadButton,
      defaultSVGRule,
      defaultHTMLRule,
      adjustedPosition,
      legendSettings,
      annotationSettings,
      overlay,
      columns,
      rScale,
      projection,
      interactionOverflow,
      canvasPostProcess,
      baseMarkProps,
      useSpans,
      canvasRendering,
      renderOrder,
      additionalDefs,
      showLinePoints,
      disableCanvasInteraction = false
    } = this.props

    const { voronoiHover } = this.state

    const areaAnnotations = []

    const totalAnnotations = annotations
      ? [...annotations, ...areaAnnotations]
      : areaAnnotations

    if (voronoiHover) {
      if (Array.isArray(voronoiHover)) {
        totalAnnotations.push(...voronoiHover)
      } else {
        totalAnnotations.push(voronoiHover)
      }
    }

    const annotationLayer = ((totalAnnotations &&
      totalAnnotations.length > 0) ||
      legendSettings) && (
      <AnnotationLayer
        legendSettings={legendSettings}
        margin={margin}
        axes={axes}
        voronoiHover={this.setVoronoi}
        annotationHandling={annotationSettings}
        pointSizeFunction={
          annotationSettings.layout &&
          annotationSettings.layout.pointSizeFunction
        }
        labelSizeFunction={
          annotationSettings.layout &&
          annotationSettings.layout.labelSizeFunction
        }
        annotations={totalAnnotations}
        svgAnnotationRule={(d, i, thisALayer) =>
          defaultSVGRule({
            d,
            i,
            annotationLayer: thisALayer,
            ...renderPipeline
          })
        }
        htmlAnnotationRule={(d, i, thisALayer) =>
          defaultHTMLRule({
            d,
            i,
            annotationLayer: thisALayer,
            ...renderPipeline
          })
        }
        useSpans={useSpans}
        size={adjustedSize}
        position={[
          adjustedPosition[0] + margin.left,
          adjustedPosition[1] + margin.top
        ]}
      />
    )

    const generatedTitle = generateFrameTitle({
      title: title,
      size: size
    })

    let marginGraphic

    const finalBackgroundGraphics =
      typeof backgroundGraphics === "function"
        ? backgroundGraphics({ size, margin })
        : backgroundGraphics

    const finalForegroundGraphics =
      typeof foregroundGraphics === "function"
        ? foregroundGraphics({ size, margin })
        : foregroundGraphics

    if (typeof matte === "function") {
      marginGraphic = matte({ size, margin })
    } else if (React.isValidElement(matte)) {
      marginGraphic = matte
    } else if (matte === true) {
      marginGraphic = (
        <path
          fill="white"
          transform={`translate(${-margin.left},${-margin.top})`}
          d={drawMarginPath({
            margin,
            size: size,
            inset: 0
          })}
          className={`${name}-matte`}
        />
      )
    }

    const finalFilterDefs = filterDefs({
      matte: marginGraphic,
      key: matte && (frameKey || name),
      additionalDefs: additionalDefs
    })

    console.log("frame size", size)

    return (
      <SpanOrDiv
        span={useSpans}
        className={`${className} frame ${name}`}
        style={{
          background: "none"
        }}
      >
        {beforeElements && (
          <SpanOrDiv
            span={useSpans}
            className={`${name} frame-before-elements`}
          >
            {beforeElements}
          </SpanOrDiv>
        )}
        <SpanOrDiv
          span={useSpans}
          className="frame-elements"
          style={{ height: `${size[1]}px`, width: `${size[0]}px` }}
        >
          <SpanOrDiv
            span={useSpans}
            className="visualization-layer"
            style={{ position: "absolute" }}
          >
            {(axesTickLines || backgroundGraphics) && (
              <svg
                className="background-graphics"
                style={{ position: "absolute" }}
                width={size[0]}
                height={size[1]}
              >
                {backgroundGraphics && (
                  <g aria-hidden={true} className="background-graphics">
                    {finalBackgroundGraphics}
                  </g>
                )}
                {axesTickLines && (
                  <g
                    transform={`translate(${adjustedPosition[0] +
                      margin.left},${adjustedPosition[1] + margin.top})`}
                    key="visualization-tick-lines"
                    className={"axis axis-tick-lines"}
                    aria-hidden={true}
                  >
                    {axesTickLines}
                  </g>
                )}
              </svg>
            )}
            {canvasRendering && (
              <canvas
                className="frame-canvas"
                ref={canvasContext => (this.canvasContext = canvasContext)}
                style={{
                  position: "absolute",
                  left: `0px`,
                  top: `0px`
                }}
                width={size[0]}
                height={size[1]}
              />
            )}
            <svg
              className="visualization-layer"
              style={{ position: "absolute" }}
              width={size[0]}
              height={size[1]}
            >
              {finalFilterDefs}

              <VisualizationLayer
                disableContext={this.props.disableContext}
                renderPipeline={renderPipeline}
                position={adjustedPosition}
                size={adjustedSize}
                projectedCoordinateNames={projectedCoordinateNames}
                xScale={xScale}
                yScale={yScale}
                axes={axes}
                title={generatedTitle}
                frameKey={frameKey}
                canvasContext={this.state.canvasContext}
                dataVersion={dataVersion}
                matte={marginGraphic}
                margin={margin}
                canvasPostProcess={canvasPostProcess}
                baseMarkProps={baseMarkProps}
                voronoiHover={this.setVoronoi}
                renderOrder={renderOrder}
              />
              {generatedTitle && (
                <g className="frame-title">{generatedTitle}</g>
              )}
              {foregroundGraphics && (
                <g aria-hidden={true} className="foreground-graphics">
                  {finalForegroundGraphics}
                </g>
              )}
            </svg>
          </SpanOrDiv>

          <InteractionLayer
            useSpans={useSpans}
            hoverAnnotation={hoverAnnotation}
            projectedX={projectedCoordinateNames.x}
            projectedY={projectedCoordinateNames.y}
            projectedYMiddle={projectedYMiddle}
            interaction={interaction}
            voronoiHover={this.setVoronoi}
            customClickBehavior={customClickBehavior}
            customHoverBehavior={customHoverBehavior}
            customDoubleClickBehavior={customDoubleClickBehavior}
            points={points}
            showLinePoints={showLinePoints}
            canvasRendering={canvasRendering}
            position={adjustedPosition}
            margin={margin}
            size={adjustedSize}
            svgSize={size}
            xScale={xScale}
            yScale={yScale}
            enabled={true}
            overlay={overlay}
            oColumns={columns}
            rScale={rScale}
            projection={projection}
            interactionOverflow={interactionOverflow}
            disableCanvasInteraction={disableCanvasInteraction}
            renderPipeline={renderPipeline}
          />
          {annotationLayer}
        </SpanOrDiv>
        {(downloadButton || afterElements) && (
          <SpanOrDiv span={useSpans} className={`${name} frame-after-elements`}>
            {downloadButton}
            {afterElements}
          </SpanOrDiv>
        )}
      </SpanOrDiv>
    )
  }
}

export default Frame
