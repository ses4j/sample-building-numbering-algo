import React from "react";
import _ from "lodash";
import "./styles.css";

function get_included_buildings_with_locations(
  submission,
  currentQuote,
  options = {}
) {
  // Get a list of buildings, ordered by campus.bldg.id then bldg.id
  // This algorithm must match `quote.get_included_buildings_with_locations()`

  let keepExcludedBuildings =
    (options && options.keepExcludedBuildings) || false;

  let current_location_number = 0;
  let next_building_number = 1;
  let last_location_id = 0;

  const getBuildingCoverageByBuildingId = bldgId => {
    return currentQuote.building_coverages.find(o => {
      return o.building_id === bldgId;
    });
  };

  let primary_building_id_for_location = {};
  currentQuote.building_coverages.forEach(bc => {
    if (!bc.location_id) return;

    if (primary_building_id_for_location[bc.location_id]) {
      if (bc.building_id < primary_building_id_for_location[bc.location_id])
        primary_building_id_for_location[bc.location_id] = bc.building_id;
    } else {
      primary_building_id_for_location[bc.location_id] = bc.building_id;
    }
  });

  let buildings_with_sortkeys = submission.buildings
    .map(bldg => {
      let bc = getBuildingCoverageByBuildingId(bldg.id);
      return {
        primary_building_id: bc.location_id
          ? primary_building_id_for_location[bc.location_id]
          : bc.building_id,
        bldg_id: bldg.id,
        bldg: bldg,
        bldg_coverage: bc
      };
    })
    .filter(
      bldg => keepExcludedBuildings || bldg.bldg_coverage.is_included_in_quote
    );

  return _.chain(buildings_with_sortkeys)
    .sortBy(["primary_building_id", "bldg_id"])
    .map(bldg_with_sortkeys => {
      let building = bldg_with_sortkeys.bldg;

      let location_number = null;
      let building_number = null;
      let location_code = "excluded";

      if (bldg_with_sortkeys.bldg_coverage.is_included_in_quote) {
        if (bldg_with_sortkeys.primary_building_id !== last_location_id) {
          current_location_number++;
          next_building_number = 1;
          last_location_id = bldg_with_sortkeys.primary_building_id;
        }

        location_number = current_location_number;
        building_number = next_building_number++;
        location_code = `${location_number}-${building_number}`;
      }

      return {
        location_number: location_number,
        building_number: building_number,
        location_code: location_code,
        building_id: building.id
      };
    })
    .value();
}

export default function App() {
  // Set up some test data from the "database"
  let buildings = [
    { id: 500, description: "Janney School", street: "1212 Mockingbird Lane" },
    { id: 501, description: "Deal School", street: "1500 Fairview Blvd" },
    { id: 502, description: "School Trailer", street: "1500 Fairview Blvd" }
  ];

  let building_coverages = [
    { id: 600, building_id: 500, location_id: 2, is_included_in_quote: true },
    { id: 601, building_id: 501, location_id: 1, is_included_in_quote: true },
    { id: 602, building_id: 502, location_id: 1, is_included_in_quote: true }
  ];
  let quote = { building_coverages: building_coverages };
  let submission = { quotes: [quote], buildings: buildings };

  // Invoke our method-under-test
  var ret = get_included_buildings_with_locations(submission, quote, {
    keepExcludedBuildings: true
  });

  // Display the results.
  return (
    <div className="App">
      <h2>Building Numbering Algorithm</h2>
      <div className="flow-table">
        <div className="header">Building ID</div>
        <div className="header">Location Code</div>
        {ret.map((r, idx) => {
          return (
            <React.Fragment>
              <div>{r.building_id}</div>
              <div>{r.location_code}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
