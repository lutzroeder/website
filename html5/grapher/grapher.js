var Grapher;
(function (Grapher) {
    var MotionChart = (function () {
        function MotionChart(element) {
            this._selection = {};
            this._radiusScale = d3.scale.sqrt();
            this._element = d3.select(element);
            this._margin = { top: 20, right: 20, bottom: 80, left: 40 };
            var width = parseFloat(this._element.attr("width"));
            var height = parseFloat(this._element.attr("height"));
            this._width = width - this._margin.right - this._margin.left;
            this._height = height - this._margin.top - this._margin.bottom;
            this.xScale = d3.scale.linear();
            this.yScale = d3.scale.linear();
        }
        Object.defineProperty(MotionChart.prototype, "dataSource", {
            set: function (value) {
                this._dataSource = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "labelData", {
            set: function (value) {
                this._labelData = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "xData", {
            set: function (value) {
                this._xData = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "yData", {
            set: function (value) {
                this._yData = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "radiusData", {
            set: function (value) {
                this._radiusData = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "colorData", {
            set: function (value) {
                this._colorData = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "startTime", {
            set: function (value) {
                this._startTime = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "endTime", {
            set: function (value) {
                this._endTime = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "xScale", {
            set: function (value) {
                this._xScale = value;
                this._xAxis = d3.svg.axis().orient("bottom").scale(this._xScale);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "yScale", {
            set: function (value) {
                this._yScale = value;
                this._yAxis = d3.svg.axis().orient("left").scale(this._yScale);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "colorScale", {
            set: function (value) {
                this._colorScale = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "xAxis", {
            get: function () {
                return this._xAxis;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MotionChart.prototype, "yAxis", {
            get: function () {
                return this._yAxis;
            },
            enumerable: true,
            configurable: true
        });
        MotionChart.prototype.select = function (label) {
            this._selection[label] = true;
        };
        MotionChart.prototype.startTransition = function () {
            if (!this._diagram) {
                this.draw();
            }
            this._timeSliderPlayButton.style("display", "none");
            this._timeSliderHead.style("display", "block");
            var startTime = this._startTime.getTime();
            var endTime = this._endTime.getTime();
            var currentTime = this._currentTime.getTime();
            var duration = ((endTime - currentTime) * 20000) / (endTime - startTime);
            var timeInterpolator = d3.interpolate(this._currentTime, this._endTime);
            var self = this;
            this._diagram.transition()
                .duration(duration)
                .ease("linear")
                .tween("date", function () {
                return function (t) {
                    self.update(new Date(timeInterpolator(t)));
                };
            })
                .each("end", function () { self.stopTransition(); });
        };
        MotionChart.prototype.stopTransition = function () {
            this._diagram.transition().duration(0);
        };
        MotionChart.prototype.draw = function () {
            this.createScales();
            this.createColorAxis();
            this.createRadiusAxis();
            this.createTimeSlider();
            this._diagram = this._element.append("g").attr("transform", "translate(" + this._margin.left + "," + this._margin.top + ")");
            this.createRules();
            this.createItems();
        };
        MotionChart.prototype.createScales = function () {
            var maxRadius = 20;
            var maxLabelWidth = 40;
            var xDomain = this.computeDomain(this._xData);
            var yDomain = this.computeDomain(this._yData);
            this._radiusDomain = this.computeDomain(this._radiusData);
            this._colorDomain = this.computeDomain(this._colorData);
            this.computeTimeDomain();
            var xScale = this._xScale.domain(xDomain).range([1.5 * maxRadius, this._width - (1.5 * maxRadius) - maxLabelWidth]);
            this._xScale = this._xScale.domain([xScale.invert(0), xScale.invert(this._width)]).range([0, this._width]).clamp(true);
            var yScale = this._yScale.domain(yDomain).range([1.5 * maxRadius, this._height - (1.5 * maxRadius)]);
            this._yScale = this._yScale.domain([yScale.invert(0), yScale.invert(this._height)]).range([this._height, 0]).clamp(true);
            this._radiusScale = this._radiusScale.domain([0, this._radiusDomain[1]]).range([2, maxRadius]).clamp(true);
            if (this._colorDomain) {
                var gradient = [
                    { "stop": 0.0, "color": "#3e53ff" },
                    { "stop": 0.33, "color": "#2ff076" },
                    { "stop": 0.5, "color": "#d0ff2f" },
                    { "stop": 0.66, "color": "#ffff2f" },
                    { "stop": 1.0, "color": "#ff2f2f" }];
                var linearGradient = this._element.append("defs").append("linearGradient").attr("id", "colorGradient").attr("x2", "1");
                gradient.forEach(function (d) { linearGradient.append("stop").attr("offset", d["stop"]).attr("stop-color", d["color"]); });
                var gradientStops = gradient.map(function (d) { return d["stop"]; });
                var gradientColors = gradient.map(function (d) { return d["color"]; });
                this._colorScale = d3.scale.linear().domain(gradientStops.map(d3.scale.linear().domain(this._colorDomain).invert)).range(gradientColors);
            }
            if (!this._colorScale) {
                this._colorScale = d3.scale.category10();
            }
        };
        MotionChart.prototype.createRules = function () {
            var rules = this._diagram.append("g").classed("rules", true);
            // x & y axis
            rules.append("g").classed("axis", true).attr("transform", "translate(0," + this._height + ")")
                .call(this.xAxis.tickSize(2, 0, 2));
            rules.append("g").classed("axis", true)
                .call(this.yAxis.tickSize(2, 0, 2));
            // grid lines
            rules.append("g").classed("grid", true).attr("transform", "translate(0," + this._height + ")")
                .call(this.xAxis.tickSize(-this._height, 0, -this._height).tickFormat(function (value) { return ""; }));
            rules.append("g").classed("grid", true)
                .call(this.yAxis.tickSize(-this._width, 0, -this._width).tickFormat(function (value) { return ""; }));
            rules.selectAll(".grid line")
                .filter(function (d) { return d == 0; })
                .classed("origin", true);
            // add axis labels
            rules.append("text").attr("text-anchor", "end").attr("x", this._width - 3).attr("y", this._height - 6).text(this._xData);
            rules.append("text").attr("text-anchor", "end").attr("x", "-3").attr("y", 11).attr("transform", "rotate(-90)").text(this._yData);
        };
        MotionChart.prototype.createColorAxis = function () {
            if (this._colorDomain) {
                var w = this._width * 0.25;
                var x = this._margin.left;
                var y = Number(this._element.attr("height")) - 30;
                var colorScale = d3.scale.linear().domain(this._colorDomain).range([0, w]);
                var colorTicks = [0, 0.5, 1].map(d3.scale.linear().domain(this._colorDomain).invert);
                var colorAxis = d3.svg.axis().orient("bottom").scale(colorScale).tickSize(2, 0, 2).tickValues(colorTicks);
                var g = this._element.append("g").attr("transform", "translate(" + x + "," + y + ")");
                g.append("g").classed("axis", true).attr("transform", "translate(0,9)").call(colorAxis);
                g.append("rect").attr("y", -3).attr("width", w).attr("height", 10).style("fill", "url(#colorGradient)");
                g.append("text").attr("text-anchor", "start").attr("dy", -8).text(this._colorData);
            }
        };
        MotionChart.prototype.createRadiusAxis = function () {
            var w = this._width * 0.25;
            var x = this._margin.left + ((this._colorDomain) ? (0.32 * this._width) : 0);
            var y = Number(this._element.attr("height")) - 30;
            var radiusScale = d3.scale.linear().domain([0, this._radiusDomain[1]]).range([0, w]);
            var radiusTicks = [0, 0.5, 1].map(d3.scale.linear().domain([0, this._radiusDomain[1]]).invert);
            var radiusAxis = d3.svg.axis().orient("bottom").scale(radiusScale).tickSize(2, 0, 2).tickValues(radiusTicks);
            var g = this._element.append("g").attr("transform", "translate(" + x + "," + y + ")");
            g.append("g").classed("axis", true).attr("transform", "translate(0,9)").call(radiusAxis);
            for (var i = 0; i < 5; i++) {
                g.append("circle").attr("cx", (i * w) / 4).attr("cy", 2).attr("r", i + 1).style("fill", "#888");
            }
            g.append("text").attr("text-anchor", "start").attr("dy", -8).text(this._radiusData);
        };
        MotionChart.prototype.createTimeSlider = function () {
            var width = parseFloat(this._element.attr("width"));
            var w = this._width * (this._colorDomain ? 0.32 : 0.64);
            var x = width - this._margin.right - w;
            var y = Number(this._element.attr("height")) - 30;
            this._timeScale = d3.time.scale().domain([this._startTime, this._endTime]).range([0, w]).clamp(true);
            ;
            var ticks = this._colorDomain ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
            ticks = ticks.map(d3.scale.linear().domain([this._startTime, this._endTime]).invert);
            var timeTicks = [];
            for (var i = 0; i < ticks.length; i++) {
                timeTicks[i] = new Date(ticks[i]);
            }
            var timeAxis = d3.svg.axis().orient("bottom").scale(this._timeScale)
                .tickSize(11, 0, 11)
                .tickValues(timeTicks)
                .tickFormat(function (value) { return value.getFullYear(); });
            var g = this._element.append("g").attr("transform", "translate(" + x + "," + y + ")");
            var self = this;
            g.append("g").classed("axis", true).call(timeAxis);
            var rect = function () { return g.append("rect").attr("rx", 2).attr("ry", 2).attr("y", -1).attr("x", -3).attr("height", 6); };
            rect().attr("width", w + 6).style("fill", "#fff");
            this._timeSlider = rect().style("fill", "#ddd");
            rect().attr("width", w + 6).style("fill", "none").style("stroke", "#888");
            this._timeSliderPosition = g.append("g");
            this._timeSliderPosition.append("line").attr("y2", -8).style("stroke", "#888");
            this._timeSliderPosition.append("text").attr("y", -10).attr("text-anchor", "middle");
            this._timeSliderHead = g.append("g").attr("pointer-events", "all").attr("cursor", "ew-resize");
            this._timeSliderHead.append("circle").attr("cy", 2).attr("r", 4).style("fill", "none").style("stroke", "#888").style("stroke-width", "5.5px");
            this._timeSliderHead.append("circle").attr("cy", 2).attr("r", 20).style("fill", "none").style("opacity", 1);
            this._timeSliderHead.style("display", "none");
            this._timeSliderHead.call(d3.behavior.drag()
                .on("dragstart", function () {
                self._timeSliderDragged = false;
            })
                .on("drag", function () {
                self._timeSliderDragged = true;
                self.stopTransition();
                var date = self._timeScale.invert(d3.event.x);
                self.update(date);
            })
                .on("dragend", function () {
                if (self._timeSliderDragged && (self._endTime.getTime() - self._currentTime.getTime()) > 0) {
                    self._timeSliderPlayButton.style("display", "block");
                    self._timeSliderHead.style("display", "none");
                }
            }));
            this._timeSliderPlayButton = g.append("g").attr("transform", "translate(0,2)").attr("pointer-events", "all").attr("cursor", "pointer");
            this._timeSliderPlayButton.append("circle").attr("cy", 0).attr("r", 6).style("fill", "#fff").style("stroke", "#888");
            this._timeSliderPlayButton.append("circle").attr("cy", 0).attr("r", 20).style("fill", "none").style("opacity", 1);
            this._timeSliderPlayButton.append("polygon").attr("points", "-2,-3 -2,3 4,0").style("fill", "#888");
            this._timeSliderPlayButton
                .on("click", function () {
                self.startTransition();
            });
        };
        MotionChart.prototype.updateTimeSlider = function (date) {
            var x = this._timeScale(date);
            this._timeSlider.attr("width", x + 6);
            this._timeSliderHead.attr("transform", "translate(" + x + ",0)");
            this._timeSliderPosition.attr("transform", "translate(" + x + ",0)");
            this._timeSliderPosition.selectAll("text").text(date.getFullYear());
            this._timeSliderPlayButton.attr("transform", "translate(" + x + ",2)");
            if ((this._endTime.getTime() - date.getTime()) <= 0) {
                this._timeSliderHead.style("display", "block");
                this._timeSliderPlayButton.style("display", "none");
            }
        };
        MotionChart.prototype.createItems = function () {
            var self = this;
            this._items = this._diagram.append("g").selectAll(".item")
                .data(this._dataSource)
                .enter()
                .append("g")
                .classed("item", true)
                .each(function (item) {
                var label = item[self._labelData];
                var g = d3.select(this);
                g.classed("selectedItem", self._selection[label]);
                g.append("text").classed("label", true).attr("y", 1).text(label);
                g.append("circle");
            })
                .on("click", function () {
                d3.select(this).classed("selectedItem", !d3.select(this).classed("selectedItem"));
            });
            this.update(this._startTime);
        };
        MotionChart.prototype.computeDomain = function (axis) {
            var self = this;
            var hasValue = true;
            self._dataSource.forEach(function (item) {
                hasValue = hasValue && (item[axis] instanceof Array) || (typeof item[axis] == "number");
            });
            if (!hasValue) {
                return null;
            }
            var min = d3.min(this._dataSource, function (item) { return (typeof item[axis] == "number") ? item[axis] : d3.min(item[axis], function (pair) { return pair[1]; }); });
            var max = d3.max(this._dataSource, function (item) { return (typeof item[axis] == "number") ? item[axis] : d3.max(item[axis], function (pair) { return pair[1]; }); });
            self._dataSource.forEach(function (item) {
                // Convert time series into a multi-value D3 scale and cache time range.
                if (item[axis] instanceof Array) {
                    var dates = item[axis].map(function (d) { return d[0]; }).map(function (date) { return self.createDate(date); });
                    var values = item[axis].map(function (d) { return d[1]; });
                    item[axis] = d3.time.scale().domain(dates).range(values);
                    item[axis]["__min"] = dates[0];
                    item[axis]["__max"] = dates[dates.length - 1];
                }
            });
            return [min, max];
        };
        MotionChart.prototype.createDate = function (date) {
            if (typeof date == "number") {
                return new Date(date, 0, 1);
            }
            if (typeof date == "string") {
                return new Date(date);
            }
            return date;
        };
        MotionChart.prototype.computeTimeDomain = function () {
            var self = this;
            var startTime = this._startTime;
            var endTime = this._endTime;
            var axes = [self._xData, self._yData, self._radiusData, self._colorData];
            axes.forEach(function (axis) {
                self._dataSource.forEach(function (item) {
                    var data = item[axis];
                    if (!(typeof data == "number") && !(typeof data == "string")) {
                        data.domain().forEach(function (value) {
                            if (!self._startTime && (!startTime || startTime > value)) {
                                startTime = value;
                            }
                            if (!self._endTime && (!endTime || endTime < value)) {
                                endTime = value;
                            }
                        });
                    }
                });
            });
            this._startTime = startTime;
            this._endTime = endTime;
        };
        MotionChart.prototype.hasValue = function (item, axis, date) {
            var data = item[axis];
            if ((typeof data == "number") || (typeof data == "string")) {
                return true;
            }
            return (date >= data["__min"] && date <= data["__max"]);
        };
        MotionChart.prototype.computeValue = function (item, axis, date) {
            var data = item[axis];
            if (!!data && data.constructor && data.call && data.apply) {
                return data(date);
            }
            return data;
        };
        MotionChart.prototype.update = function (date) {
            this._currentTime = date;
            this.updateTimeSlider(date);
            var self = this;
            this._items.each(function (data) {
                if (self.hasValue(data, self._xData, date) &&
                    self.hasValue(data, self._yData, date) &&
                    self.hasValue(data, self._radiusData, date)) {
                    var x = self._xScale(self.computeValue(data, self._xData, date));
                    var y = self._yScale(self.computeValue(data, self._yData, date));
                    var r = self.computeValue(data, self._radiusData, date);
                    var radius = self._radiusScale((r < 0) ? 0 : r);
                    var color = self.hasValue(data, self._colorData, date) ? self._colorScale(self.computeValue(data, self._colorData, date)) : "#fff";
                    var textPosition = 1 + (1.1 * radius);
                    d3.select(this).style("display", "block");
                    d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
                    d3.select(this).selectAll("circle").attr("r", radius).style("fill", color);
                    d3.select(this).selectAll("text").attr("transform", "translate(" + textPosition + ",0)");
                }
                else {
                    d3.select(this).style("display", "none");
                }
            });
            this._items.sort(function (a, b) {
                return b[self.radiusData] - a[self.radiusData];
            });
        };
        return MotionChart;
    })();
    Grapher.MotionChart = MotionChart;
})(Grapher || (Grapher = {}));
