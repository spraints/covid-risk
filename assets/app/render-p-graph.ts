import * as d3 from 'd3'
import {Cases} from './types'
import {Model} from './model'
import clear from './clear'

// see https://github.com/Lemoncode/d3js-typescript-examples

export function renderPGraph(el: HTMLElement | null, data: Cases, model: Model) {
  if (!el) return
  el.hidden = true
  clear(el)
  el.append(makeSVG(convert(model)) as Node)
  el.hidden = false
}

type Point = {
  x: number
  y: number
}

const xaxislabel = "Size of group"
const yaxislabel = "Chance of COVID-19+ participant"

function convert(model: Model): Point[] {
  const res: Point[] = []
  for (let n = 1; n < 1000000; n *= 2) {
    const p = model.p(n)
    res.push({x: n, y: 100 * p})
    if (p > 0.99) {
      break
    }
  }
  return res
}

function makeSVG(data: Point[]) {
  const svg = d3.create("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);

  const x = makeX(data)
  const y = makeY(data)

  const line = makeLine(x, y)

  const xAxis = makeXAxis(data, x)
  const yAxis = makeYAxis(data, y)

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

const width = 500
const height = 250
const margin = {top: 20, right: 30, bottom: 30, left: 40}

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
  return d3.scaleLog()
    .domain([1, 10000])
    .range([margin.left, width - margin.right])
}

function makeY(data: Point[]) {
  return d3.scaleLinear()
    .domain([0, 50])
    .range([height - margin.bottom, margin.top])
}

function makeXAxis(data: Point[], x: any) {
  return function(g: any) {
    return g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(null, "d"))
      .call((g: any) => g.select(".domain").remove())
      .call((g: any) => g.selectAll(".tick line").clone()
                .attr("y2", -height)
                .attr("stroke-opacity", 0.1))
      .call((g: any) => g.append("text")
                .attr("x", width - 4)
                .attr("y", -4)
                .attr("font-weight", "bold")
                .attr("text-anchor", "end")
                .attr("fill", "black")
                .text(xaxislabel)
                .call(halo))
  }
}

function makeYAxis(data: Point[], y: any) {
  return function(g: any) {
    return g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(null, "d"))
      .call((g: any) => g.select(".domain").remove())
      .call((g: any) => g.selectAll(".tick line").clone()
                .attr("x2", width)
                .attr("stroke-opacity", 0.1))
      .call((g: any) => g.select(".tick:last-of-type text").clone()
                .attr("x", 4)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .attr("fill", "black")
                .text(yaxislabel)
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
