var freqData = [
  { State: "AL", freq: { low: 4786, mid: 1319, high: 249 } },
  { State: "AZ", freq: { low: 1101, mid: 412, high: 674 } },
  { State: "CT", freq: { low: 932, mid: 2149, high: 418 } },
  { State: "DE", freq: { low: 832, mid: 1152, high: 1862 } },
  { State: "FL", freq: { low: 4481, mid: 3304, high: 948 } },
  { State: "GA", freq: { low: 1619, mid: 167, high: 1063 } },
  { State: "IA", freq: { low: 1819, mid: 247, high: 1203 } },
  { State: "IL", freq: { low: 4498, mid: 3852, high: 942 } },
  { State: "IN", freq: { low: 797, mid: 1849, high: 1534 } },
  { State: "KS", freq: { low: 162, mid: 379, high: 471 } }
];

function displayMainViz(id, data, attackerCountData) {
  let barColor = "#6772E5";

  // Function to handle histogram
  function histogram(fD) {
    var hG = {}, hGDim = { t: 60, r: 0, b: 30, l: 0 };
    hGDim.w = 650 - hGDim.l - hGDim.r,
      hGDim.h = 300 - hGDim.t - hGDim.b;

    // Create function for x-axis and y-axis mapping.
    var x = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1).domain(fD.map(function (d) { return d[0]; }));
    var y = d3.scale.linear().range([hGDim.h, 0]).domain([0, d3.max(fD, function (d) { return d[1]; })]);

    // Create svg for histogram.
    var histogramSVG = d3.select(id)
      .append("svg")
      .attr("width", hGDim.w + hGDim.l + hGDim.r)
      .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
      .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")")

    // Add x-axis to the histogram svg.
    histogramSVG
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + hGDim.h + ")")
      .call(d3.svg.axis().scale(x).orient("bottom"));

    // Create bars for histogram to contain rectangles and freq labels.
    var bars = histogramSVG.selectAll(".bar")
      .data(fD)
      .enter()
      .append("g")
      .attr("class", "bar");

    // Create the rectangles.
    bars
      .append("rect")
      .attr("x", d => x(d[0]))
      .attr("y", d => y(d[1]))
      .attr("width", x.rangeBand())
      .attr("height", d => hGDim.h - y(d[1]))
      .attr('fill', barColor)
      .on("mouseover", mouseover)// mouseover is defined below.
      .on("mouseout", mouseout);// mouseout is defined below.

    // Create the frequency labels above the rectangles.
    bars
      .append("text").text(d => d3.format(",")(d[1]))
      .attr("x", d => x(d[0]) + x.rangeBand() / 2)
      .attr("y", d => y(d[1]) - 5)
      .attr("text-anchor", "middle");

    // Utility function to be called on mouseover.
    function mouseover(d) {
      // Filter for selected state.
      let st = data.filter(s => s.desc == d[0])[0];
      let nD = d3.keys(st.src_host).map(function (s) { return { ip: s, total: st.src_host[s] } });

      // Call update functions of pie-chart and legend.    
      pC.update(nD);
      // leg.update(nD);
    }

    // Utility function to be called on mouseout.
    function mouseout(d) {
      // Reset the pie-chart and legend.    
      pC.update(attackerCountData);
      // leg.update(attackerCountData);
    }

    // Create function to update the bars on pie chart mouse over.
    hG.update = function (nD, color) {
      // Update the domain of the y-axis map to reflect change in frequencies.
      y.domain([0, d3.max(nD, function (d) { return d[1]; })]);

      // Attach the new data to the bars.
      var bars = histogramSVG.selectAll(".bar").data(nD);

      // Transition the height and color of rectangles.
      bars.select("rect").transition().duration(500)
        .attr("y", function (d) { return y(d[1]); })
        .attr("height", function (d) { return hGDim.h - y(d[1]); })
        .attr("fill", color);

      // Transition the frequency labels location and change value.
      bars.select("text").transition().duration(500)
        .text(function (d) { return d3.format(",")(d[1]) })
        .attr("y", function (d) { return y(d[1]) - 5; });
    }

    return hG;
  }

  // Function to handle pieChart.
  function pieChart(origignalData, pD) {
    var pC = {}, pieDim = { w: 250, h: 250 };
    pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;

    // Create svg for pie chart.
    var pieSVG = d3.select(id)
      .append("svg")
      .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
      .attr("transform", "translate(" + pieDim.w / 2 + "," + pieDim.h / 2 + ")");

    // Create function to draw the arcs of the pie slices.
    var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);

    // Create a function to compute the pie slice angles.
    var pie = d3.layout.pie().sort(null).value(d => d.total);

    // Draw the pie slices.
    pieSVG
      .selectAll("path")
      .data(pie(pD))
      .enter()
      .append("path")
      .attr("d", arc)
      .each(function (d) { this._current = d; })
      .style("fill", '#6772E5')
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

    // Create function to update pie-chart. This will be used by histogram.
    pC.update = function (nD) {
      pieSVG
        .selectAll("path")
        .data(pie(nD))
        .transition()
        .duration(500)
        .attrTween("d", arcTween)
    }

    // Utility function to be called on mouseover a pie slice.
    function mouseover(d) {
      // Call the update function of histogram with new data.
      let ip = d.data.ip;
      hG.update(ip);
      // segColor(d.data.type));
    }
    //Utility function to be called on mouseout a pie slice.
    function mouseout(d) {
      // call the update function of histogram with all data.
      hG.update(data.map(v => {
        return [v.desc, v.total];
      }), barColor);
    }
    // Animating the pie-slice requiring a custom function which specifies
    // how the intermediate paths should be drawn.
    function arcTween(a) {
      var i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function (t) { return arc(i(t)); };
    }

    return pC;
  }

  // Calculate total frequency by state for all segments.
  let displayData = data.map(function (d) { return [d.desc, d.total]; });
  let hG = histogram(displayData);
  let pC = pieChart(data, attackerCountData); // create the pie-chart.
}


function dashboard(id, data) {
  var barColor = "#6772E5";
  function segColor(c) {
    return { low: "#807dba", mid: "#e08214", high: "#41ab5d" }[c];
  }
  // Compute total for each state.
  data.forEach((d) => {
    d.total = d.freq.low + d.freq.mid + d.freq.high;
  });

  // function to handle histogram.
  function histogram(fD) {
    var hG = {}, hGDim = { t: 60, r: 0, b: 30, l: 0 };
    hGDim.w = 500 - hGDim.l - hGDim.r,
      hGDim.h = 300 - hGDim.t - hGDim.b;

    // Create function for x-axis and y-axis mapping.
    var x = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1).domain(fD.map(function (d) { return d[0]; }));
    var y = d3.scale.linear().range([hGDim.h, 0]).domain([0, d3.max(fD, function (d) { return d[1]; })]);

    //create svg for histogram.
    var histogramSVG = d3.select(id)
      .append("svg")
      .attr("width", hGDim.w + hGDim.l + hGDim.r)
      .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
      .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")")

    // Add x-axis to the histogram svg.
    histogramSVG
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + hGDim.h + ")")
      .call(d3.svg.axis().scale(x).orient("bottom"));

    // Create bars for histogram to contain rectangles and freq labels.
    var bars = histogramSVG.selectAll(".bar")
      .data(fD)
      .enter()
      .append("g")
      .attr("class", "bar");

    // Create the rectangles.
    bars
      .append("rect")
      .attr("x", function (d) { return x(d[0]); })
      .attr("y", function (d) { return y(d[1]); })
      .attr("width", x.rangeBand())
      .attr("height", function (d) { return hGDim.h - y(d[1]); })
      .attr('fill', barColor)
      .on("mouseover", mouseover)// mouseover is defined below.
      .on("mouseout", mouseout);// mouseout is defined below.

    // Create the frequency labels above the rectangles.
    bars
      .append("text").text(function (d) { return d3.format(",")(d[1]) })
      .attr("x", function (d) { return x(d[0]) + x.rangeBand() / 2; })
      .attr("y", function (d) { return y(d[1]) - 5; })
      .attr("text-anchor", "middle");

    // Utility function to be called on mouseover.
    function mouseover(d) {
      // Filter for selected state.
      var st = data.filter(function (s) { return s.State == d[0]; })[0], nD = d3.keys(st.freq).map(function (s) { return { type: s, freq: st.freq[s] }; });

      // Call update functions of pie-chart and legend.    
      pC.update(nD);
      leg.update(nD);
    }

    // Utility function to be called on mouseout.
    function mouseout(d) {
      // Reset the pie-chart and legend.    
      pC.update(tF);
      leg.update(tF);
    }

    // Create function to update the bars. This will be used by pie-chart.
    hG.update = function (nD, color) {
      // Update the domain of the y-axis map to reflect change in frequencies.
      y.domain([0, d3.max(nD, function (d) { return d[1]; })]);

      // Attach the new data to the bars.
      var bars = histogramSVG.selectAll(".bar").data(nD);

      // Transition the height and color of rectangles.
      bars.select("rect").transition().duration(500)
        .attr("y", function (d) { return y(d[1]); })
        .attr("height", function (d) { return hGDim.h - y(d[1]); })
        .attr("fill", color);

      // Transition the frequency labels location and change value.
      bars.select("text").transition().duration(500)
        .text(function (d) { return d3.format(",")(d[1]) })
        .attr("y", function (d) { return y(d[1]) - 5; });
    }
    return hG;
  }

  // Function to handle pieChart.
  function pieChart(pD) {

    var pC = {}, pieDim = { w: 250, h: 250 };
    pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;

    // create svg for pie chart.
    var piesvg = d3.select(id).append("svg")
      .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
      .attr("transform", "translate(" + pieDim.w / 2 + "," + pieDim.h / 2 + ")");

    // create function to draw the arcs of the pie slices.
    var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);

    // create a function to compute the pie slice angles.
    var pie = d3.layout.pie().sort(null).value(function (d) { return d.freq; });

    // Draw the pie slices.
    piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
      .each(function (d) { this._current = d; })
      .style("fill", function (d) { return segColor(d.data.type); })
      .on("mouseover", mouseover).on("mouseout", mouseout);

    // create function to update pie-chart. This will be used by histogram.
    pC.update = function (nD) {
      piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
        .attrTween("d", arcTween);
    }
    // Utility function to be called on mouseover a pie slice.
    function mouseover(d) {
      // call the update function of histogram with new data.
      hG.update(data.map(function (v) {
        return [v.State, v.freq[d.data.type]];
      }), segColor(d.data.type));
    }
    //Utility function to be called on mouseout a pie slice.
    function mouseout(d) {
      // call the update function of histogram with all data.
      hG.update(data.map(function (v) {
        return [v.State, v.total];
      }), barColor);
    }
    // Animating the pie-slice requiring a custom function which specifies
    // how the intermediate paths should be drawn.
    function arcTween(a) {
      var i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function (t) { return arc(i(t)); };
    }
    return pC;
  }

  // Function to handle legend
  function legend(lD) {
    var leg = {};

    // create table for legend.
    var legend = d3.select(id).append("table").attr('class', 'legend');

    // create one row per segment.
    var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");

    // create the first column for each segment.
    tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
      .attr("width", '16').attr("height", '16')
      .attr("fill", function (d) { return segColor(d.type); });

    // create the second column for each segment.
    tr.append("td").text(function (d) { return d.type; });

    // create the third column for each segment.
    tr.append("td").attr("class", 'legendFreq')
      .text(function (d) { return d3.format(",")(d.freq); });

    // create the fourth column for each segment.
    tr.append("td").attr("class", 'legendPerc')
      .text(function (d) { return getLegend(d, lD); });

    // Utility function to be used to update the legend.
    leg.update = function (nD) {
      // update the data attached to the row elements.
      var l = legend.select("tbody").selectAll("tr").data(nD);

      // update the frequencies.
      l.select(".legendFreq").text(function (d) { return d3.format(",")(d.freq); });

      // update the percentage column.
      l.select(".legendPerc").text(function (d) { return getLegend(d, nD); });
    }

    function getLegend(d, aD) { // Utility function to compute percentage.
      return d3.format("%")(d.freq / d3.sum(aD.map(function (v) { return v.freq; })));
    }

    return leg;
  }

  // calculate total frequency by segment for all state.
  var tF = ['low', 'mid', 'high'].map(function (d) {
    return { type: d, freq: d3.sum(data.map(function (t) { return t.freq[d]; })) };
  });

  // calculate total frequency by state for all segments.
  var totalFrequency = data.map(function (d) { return [d.State, d.total]; });

  var hG = histogram(totalFrequency), // create the histogram.
    pC = pieChart(tF), // create the pie-chart.
    leg = legend(tF);  // create the legend.
}