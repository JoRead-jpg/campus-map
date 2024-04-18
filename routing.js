// Description: This file contains the implementation of Dijkstra's algorithm to find the shortest path between two nodes in a graph.

// Path to the JSON file
const jsonUrl =
  "https://gist.githubusercontent.com/denniesbor/1281c233cdaa83e9c35621d83b10ea7e/raw/f3e31d515d8cf038a92551d1ea00da91cc4e1fc0/all_floors_data.json";

// Function to fetch and return the JSON data
async function loadGraphData() {
  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error("Could not load the JSON data:", error);
  }
}

// Function to find the shortest path between two nodes using Dijkstra's algorithm
async function dijkstraWithPath(start, end, currentFloor) {
  const data = await loadGraphData();
  let graph, coordinates;
  if (data) {
    const currentFloorData = data[currentFloor];
    graph = currentFloorData.graph;
    coordinates = currentFloorData.coordinates;
  }

  start = String(start);
  end = String(end);
  currentFloor = String(currentFloor);

  if (!graph || start === end) return []; // No graph or same start and end nodes

  let distances = {};
  let previous = {};
  let visited = new Set();
  let nodes = Object.keys(graph);

  nodes.forEach((node) => (distances[node] = Infinity));
  distances[start] = 0;

  while (nodes.length) {
    nodes = nodes.filter((node) => !visited.has(node));
    nodes.sort((a, b) => distances[a] - distances[b]);
    let closestNode = nodes.shift();

    if (distances[closestNode] === Infinity) {
      console.log("Break: remaining nodes are unreachable.");
      break;
    }

    visited.add(closestNode);

    Object.keys(graph[closestNode]).forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        let newDistance = distances[closestNode] + graph[closestNode][neighbor];
        if (newDistance < distances[neighbor]) {
          distances[neighbor] = newDistance;
          previous[neighbor] = closestNode;
        }
      }
    });
  }

  let path = [];
  let currentNode = end;

  if (!previous[end]) {
    return []; // No path found
  }

  while (currentNode !== start) {
    if (!currentNode || !previous[currentNode]) {
      return []; // Handle case where path breaks
    }
    path.unshift(currentNode);
    currentNode = previous[currentNode];
  }
  path.unshift(start);

  // Get the coordinates of the path nodes
  const pathCoordinates = getPathCoordinates(path, coordinates);

  return pathCoordinates;
}

// Function to get the coordinates of the nodes in the path
function getPathCoordinates(path, coordinates) {
  let pathCoordinates = [];

  for (let node of path) {
    if (coordinates[node]) {
      pathCoordinates.push(coordinates[node]);
    } else {
      console.error("Coordinates for node", node, "not found.");
    }
  }

  return pathCoordinates;
}

export default dijkstraWithPath;
