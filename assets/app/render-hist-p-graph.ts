import * as d3 from 'd3'
import {Cases} from './types'
import {Model} from './model'
import clear from './clear'

// see https://github.com/Lemoncode/d3js-typescript-examples

export function renderHistPGraph(el: HTMLElement | null, data: Cases, model: Model, groupSize: number) {
  if (!el) return
  el.hidden = true
  clear(el)
  el.append(makeSVG(convert(model, groupSize), groupSize) as Node)
  el.hidden = false
}

type Point = {
  x: Date
  y: number
}

const xaxislabel = "Date"

function yaxislabel(n: number) {
  return `Chance of COVID-19+ participant in group of ${n}`
}

const WIDTH = 500
const HEIGHT = 500
const MARGIN = {top: 20, right: 30, bottom: 30, left: 40}

const DAYS_TO_GRAPH = 180
const DAY_IN_MS = 86400 * 1000

function convert(model: Model, groupSize: number): Point[] {
  const res: Point[] = []
  const lastDate = model.lastDate.getTime()
  for (let n = 0; n < DAYS_TO_GRAPH; n++) {
    const date = new Date(lastDate - n*DAY_IN_MS)
    const p = model.pDate(groupSize, date)
    res.push({x: date, y: 100 * p})
  }
  return res.reverse()
}

function makeSVG(data: Point[], groupSize: number) {
  const svg = d3.create("svg")
      .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);

  const x = makeX(data)
  const y = makeY(data)

  const line = makeLine(x, y)

  const xAxis = makeXAxis(data, x)
  const yAxis = makeYAxis(data, y, groupSize)

  const l = length(line(data));

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 2.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line)

  svg.append("g")
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
    .selectAll("circle")
    .data(data)
    .join("circle")
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("r", 3);

  return svg.node();
}

function length(path: any) {
  const n = d3.create("svg:path").attr("d", path).node() as any
  return n.getTotalLength()
}

function makeLine(x: any, y: any) {
  return d3.line<Point>()
    .curve(d3.curveCatmullRom)
    .x(d => x(d.x))
    .y(d => y(d.y))
}

function makeX(data: Point[]) {
  return d3.scaleTime()
    .domain(d3.extent(data, d => d.x) as [Date, Date])
    .range([MARGIN.left, WIDTH - MARGIN.right])
}

function makeY(data: Point[]) {
  return d3.scaleLinear()
    .domain([0, 100])
    .range([HEIGHT - MARGIN.bottom, MARGIN.top])
}

function makeXAxis(data: Point[], x: any) {
  return function(g: any) {
    return g
      .attr("transform", `translate(0,${HEIGHT - MARGIN.bottom})`)
      .call(d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%d-%b") as any))
      .call((g: any) => g.select(".domain").remove())
      .call((g: any) => g.selectAll(".tick line").clone()
                .attr("y2", -HEIGHT)
                .attr("stroke-opacity", 0.1))
      .call((g: any) => g.append("text")
                .attr("x", WIDTH - 4)
                .attr("y", -4)
                .attr("font-weight", "bold")
                .attr("text-anchor", "end")
                .attr("fill", "black")
                .text(xaxislabel)
                .call(halo))
  }
}

function makeYAxis(data: Point[], y: any, groupSize: number) {
  return function(g: any) {
    return g
      .attr("transform", `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(y).ticks(null, "d"))
      .call((g: any) => g.select(".domain").remove())
      .call((g: any) => g.selectAll(".tick line").clone()
                .attr("x2", WIDTH)
                .attr("stroke-opacity", 0.1))
      .call((g: any) => g.select(".tick:last-of-type text").clone()
                .attr("x", 4)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .attr("fill", "black")
                .text(yaxislabel(groupSize))
                .call(halo))
  }
}

function halo(text: any) {
  text.select(function(this: any) { const el = this as Element; return el.parentNode?.insertBefore(el.cloneNode(true), this); })
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 4)
    .attr("stroke-linejoin", "round");
}
