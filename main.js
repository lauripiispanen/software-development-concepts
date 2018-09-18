(function () {
  var network;
  var allNodes;
  var nodesDataSet;
  var container = document.getElementById('content');
  var highlightActive = false;
  var nodesDataset;
  var edgesDataset;

  document.getElementById('input').addEventListener('keypress', (event) => {
    if (event.keyCode == 13) {
      findNode(event.target.value);
      return false;
    }
  });

  document.getElementById('clear').addEventListener('click', () => {
    document.getElementById('input').value = '';
  });

  fetch('concepts.dot')
    .then(res => res.text())
    .then(initNetworkData)
    .catch(console.error);

  function initNetworkData(DOTdata) {
    var parsedData = vis.network.convertDot(DOTdata);
    nodesDataset = new vis.DataSet(parsedData.nodes);
    edgesDataset = new vis.DataSet(parsedData.edges);
    drawNetwork();
  }

  function drawNetwork() {
    var data = {
      nodes: nodesDataset,
      edges: edgesDataset
    };

    var options = {
      nodes: {
        shape: 'dot',
        font: {
          size: 16
        }
      },
      edges: {
        width: 0.15,
        color: {inherit: 'from'},
        smooth: {
          type: 'continuous'
        }
      },
      interaction: {
        tooltipDelay: 200
      },
      layout: {
        improvedLayout: false,
        randomSeed: 6
      },
      physics: {
        solver: 'forceAtlas2Based',
        stabilization: {iterations: 150},
        adaptiveTimestep: true,
        forceAtlas2Based: {
            gravitationalConstant: -26,
            centralGravity: 0.0025,
            springLength: 230,
            springConstant: 0.18
        },
        maxVelocity: 146,
        timestep: 0.35
      }
    };

    network = new vis.Network(container, data, options);
    allNodes = data.nodes.get({returnType: 'Object'});
    network.on('click', neighbourhoodHighlight);
  }

  function findNode (value) {
    var bestMatch;
    var bestResult = 0;
    var result;

    nodesDataset.forEach((data) => {
      result = similarity(data.id.toLowerCase(), value.toLowerCase());
      if (result > bestResult) {
        bestMatch = data;
        bestResult = result;
      }
    });

    neighbourhoodHighlight({nodes: [bestMatch.id]});
  }

  function neighbourhoodHighlight(params) {
    // if something is selected:
    if (params.nodes.length > 0) {
      highlightActive = true;
      var i, j;
      var selectedNode = params.nodes[0];
      var degrees = 2;
      var connectedNodes = network.getConnectedNodes(selectedNode);

      hideNodes(allNodes);
      highlightSecondDegreeNodes(allNodes, connectedNodes, degrees);
      highlightFirstDegreeNodes(allNodes, connectedNodes);
      highlightMainNode(allNodes, selectedNode);
    } else if (highlightActive === true) {
      resetNodes(allNodes);
      highlightActive = false
    }

    // transform the object into an array
    var updateArray = [];
    for (nodeId in allNodes) {
      if (allNodes.hasOwnProperty(nodeId)) {
        updateArray.push(allNodes[nodeId]);
      }
    }
    nodesDataset.update(updateArray);
  }

  function hideNodes (allNodes) {
    for (var nodeId in allNodes) {
      allNodes[nodeId].color = 'rgba(200, 200, 200, 0.5)';
      hideLabel(allNodes[nodeId]);
    }
  }

  function getAllConnectedNodes (connectedNodes, degrees) {
    for (i = 1; i < degrees; i++) {
      for (j = 0; j < connectedNodes.length; j++) {
        return [].concat(network.getConnectedNodes(connectedNodes[j]));
      }
    }
  }

  function highlightSecondDegreeNodes (allNodes, connectedNodes, degrees) {
    var allConnectedNodes = getAllConnectedNodes(connectedNodes, degrees);
    for (i = 0; i < allConnectedNodes.length; i++) {
      allNodes[allConnectedNodes[i]].color = 'rgba(0, 0, 255, 0.3)';
      showLabel(allNodes[allConnectedNodes[i]]);
    }
  }

  function highlightFirstDegreeNodes (allNodes, connectedNodes) {
    for (i = 0; i < connectedNodes.length; i++) {
      allNodes[connectedNodes[i]].color = 'rgba(255, 0, 0, 0.3)';
      showLabel(allNodes[connectedNodes[i]]);
    }
  }

  function highlightMainNode (allNodes, selectedNode) {
    allNodes[selectedNode].color = 'rgba(255, 0, 0, 0.6)';
    allNodes[selectedNode].clicked = true;
    showLabel(allNodes[selectedNode]);
  }

  function resetNodes (allNodes) {
    for (var nodeId in allNodes) {
      allNodes[nodeId].color = allNodes[nodeId].clicked ? 'rgba(0, 255, 0, 0.4)' : 'rgba(0, 0, 255, 0.3)';
      showLabel(allNodes[nodeId]);
    }
  }

  function hideLabel (node) {
    if (node.hiddenLabel === undefined) {
      node.hiddenLabel = node.label;
      node.label = undefined;
    }
  }

  function showLabel (node) {
    if (node.hiddenLabel !== undefined) {
      node.label = node.hiddenLabel;
      node.hiddenLabel = undefined;
    }
  }

  function freqVector (word, letters) {
    var freq = _.groupBy(word.split(''), function(l) {return l;});
    return _.map(letters, function(l) {
      return freq[l] ? freq[l].length : 0;
    });
  }

  function dot (v1, v2) {
    return _.reduce(_.zip(v1, v2), function(acc, els) {
      return acc + els[0] * els[1];
    }, 0);
  }

  function mag(v) {
    return Math.sqrt(_.reduce(v, function(acc, el) {
      return acc + el * el;
    }, 0));
  }

  function similarity (word1, word2) {
    var letters = _.union(word1.split(''), word2.split(''));
    var v1 = freqVector(word1, letters);
    var v2 = freqVector(word2, letters);
    return dot(v1, v2) / (mag(v1) * mag(v2));
  }
})();
