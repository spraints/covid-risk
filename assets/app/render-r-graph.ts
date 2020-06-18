import * as d3 from 'd3'
import {Cases} from './types'
import clear from './clear'

// see https://github.com/Lemoncode/d3js-typescript-examples

export function renderRGraph(el: HTMLElement | null, data: Cases) {
  if (!el) return
  el.hidden = true
  clear(el)
  el.append(makeSVG(convert(data)) as Node)
  el.hidden = false
}

type Point = {
  orient: string
  name: string
  x: number
  y: number
}

const xaxislabel = "Cumulative cases"
const yaxislabel = "New cases in the last week"

function convert(data: Cases): Point[] {
  const res: Point[] = []
  const labelMod = (data.cases.length - 1) % 7
  const mid = data.cases.length / 2
  for (let i = 7; i < data.cases.length; i++) {
    const cum = data.cases[i][1]
    const diff = data.cases[i][1] - data.cases[i-7][1]
    if (cum > 0 && diff > 0) {
      // Alternatively, push undefined 'y' values. tsc doesn't like it, though.
      res.push({
        orient: i < mid ? "left" : "right",
        name: i % 7 == labelMod ? data.cases[i][0] : '',
        x: cum,
        y: diff
      })
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
      .attr("stroke-dasharray", `0,${l}`)
      .attr("d", line)
    .transition()
      .duration(5000)
      .ease(d3.easeLinear)
      .attr("stroke-dasharray", `${l},${l}`);

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

  const label = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
    .selectAll("g")
    .data(data)
    .join("g")
      .attr("transform", d => `translate(${x(d.x)},${y(d.y)})`)
      .attr("opacity", 0);

  label.append("text")
      .text(d => d.name)
      .each(function(d) {
        const t = d3.select(this);
        switch (d.orient) {
          case "top": t.attr("text-anchor", "middle").attr("dy", "-0.7em"); break;
          case "right": t.attr("dx", "0.5em").attr("dy", "0.32em").attr("text-anchor", "start"); break;
          case "bottom": t.attr("text-anchor", "middle").attr("dy", "1.4em"); break;
          case "left": t.attr("dx", "-0.5em").attr("dy", "0.32em").attr("text-anchor", "end"); break;
        }
      })
      .call(halo);

  label.transition()
      .delay((d, i) => length(line(data.slice(0, i + 1))) / l * (5000 - 125))
      .attr("opacity", 1);

  return svg.node();
}

const width = 500
const height = 500
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
    .domain(d3.extent<Point, number>(data, d => d.x) as [number, number]).nice()
    .range([margin.left, width - margin.right])
}

function makeY(data: Point[]) {
  return d3.scaleLog()
    .domain(d3.extent<Point, number>(data, d => d.y) as [number, number]).nice()
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
