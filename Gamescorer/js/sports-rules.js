
"use strict";

GS.Sports = (() => {

  const rules = {
    "Basketball": {
      format: "points",
      target: 100,
      bestOf: 1,
      winBy: 1,
      period: "Quarter",
      periods: 4,
      duration: 10,
      description: "Four quarters, 1-point free throws, 2-point field goals and 3-point shots."
    },

    "3x3 Basketball": {
      format: "points",
      target: 21,
      bestOf: 1,
      winBy: 1,
      period: "Game",
      periods: 1,
      duration: 10,
      description: "First team to 21 points or the highest score at the time limit."
    },

    "Volleyball": {
      format: "sets",
      target: 25,
      bestOf: 5,
      winBy: 2,
      period: "Set",
      periods: 5,
      description: "Best of five sets. The deciding set is normally played to 15."
    },

    "Beach Volleyball": {
      format: "sets",
      target: 21,
      bestOf: 3,
      winBy: 2,
      period: "Set",
      periods: 3,
      description: "Best of three sets with a deciding set."
    },

    "Badminton": {
      format: "sets",
      target: 21,
      bestOf: 3,
      winBy: 2,
      period: "Game",
      periods: 3,
      description: "Best of three games, normally to 21 rally points."
    },

    "Tennis": {
      format: "sets",
      target: 6,
      bestOf: 3,
      winBy: 2,
      period: "Set",
      periods: 3,
      description: "Sets consist of games. Tennis uses 15, 30, 40 and game scoring."
    },

    "Pickleball": {
      format: "sets",
      target: 11,
      bestOf: 3,
      winBy: 2,
      period: "Game",
      periods: 3,
      description: "Commonly best of three games to 11, win by two."
    },

    "Table Tennis": {
      format: "sets",
      target: 11,
      bestOf: 5,
      winBy: 2,
      period: "Game",
      periods: 5,
      description: "Best of five or seven games, normally to 11 points."
    },

    "Football / Soccer": {
      format: "goals",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Half",
      periods: 2,
      duration: 45,
      description: "Two halves. Extra time and penalty shootouts can be recorded separately."
    },

    "Futsal": {
      format: "goals",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Half",
      periods: 2,
      duration: 20,
      description: "Two halves with accumulated fouls and optional extra time."
    },

    "Sepak Takraw": {
      format: "sets",
      target: 21,
      bestOf: 3,
      winBy: 2,
      period: "Set",
      periods: 3,
      description: "Set-based scoring; target and deciding set depend on competition rules."
    },

    "Arnis": {
      format: "points",
      target: 10,
      bestOf: 3,
      winBy: 1,
      period: "Round",
      periods: 3,
      description: "Point scoring by round; scoring criteria must follow event rules."
    },

    "Boxing": {
      format: "rounds",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Round",
      periods: 3,
      description: "Judge scoring by round, with results recorded manually."
    },

    "Wrestling": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Period",
      periods: 3,
      description: "Technical points and match-ending criteria depend on the ruleset."
    },

    "Karate": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Bout",
      periods: 1,
      description: "Points and penalties according to the selected karate rules."
    },

    "Taekwondo": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Round",
      periods: 3,
      description: "Scoring by legal techniques and electronic or manual judging."
    },

    "Judo": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Bout",
      periods: 1,
      description: "Ippon, waza-ari and penalties according to the competition rules."
    },

    "Chess": {
      format: "manual",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Game",
      periods: 1,
      description: "Record win, loss or draw; use a chess clock separately."
    },

    "Billiards / Pool": {
      format: "frames",
      target: 0,
      bestOf: 3,
      winBy: 1,
      period: "Rack",
      periods: 3,
      description: "Track racks or frames won."
    },

    "Darts": {
      format: "points",
      target: 501,
      bestOf: 3,
      winBy: 1,
      period: "Leg",
      periods: 3,
      description: "Common 501 format. This preset needs a countdown scoring mode for official darts."
    },

    "Bowling": {
      format: "frames",
      target: 300,
      bestOf: 1,
      winBy: 1,
      period: "Frame",
      periods: 10,
      description: "Ten frames with cumulative pin scoring."
    },

    "Swimming": {
      format: "time",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Race",
      periods: 1,
      description: "Record finish times; lower time wins."
    },

    "Athletics / Track & Field": {
      format: "time",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Event",
      periods: 1,
      description: "Record times or distances depending on the event."
    },

    "Cycling": {
      format: "time",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Race",
      periods: 1,
      description: "Record finish time or position."
    },

    "Dragon Boat": {
      format: "time",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Race",
      periods: 1,
      description: "Compare race times; lower time wins."
    },

    "Softball": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Inning",
      periods: 7,
      description: "Record runs by inning."
    },

    "Baseball": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Inning",
      periods: 9,
      description: "Record runs by inning."
    },

    "Rugby": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Half",
      periods: 2,
      description: "Try, conversion, penalty and drop-goal points."
    },

    "Pencak Silat": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Round",
      periods: 3,
      description: "Technical points and penalties."
    },

    "Wushu": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Round",
      periods: 1,
      description: "Judge-based or combat scoring depending on discipline."
    },

    "Weightlifting": {
      format: "points",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Attempt",
      periods: 6,
      description: "Record successful lift weights and total."
    },

    "Sipa": {
      format: "points",
      target: 15,
      bestOf: 3,
      winBy: 2,
      period: "Set",
      periods: 3,
      description: "Scoring varies by Sipa discipline and event rules."
    },

    "Lawn Tennis": {
      format: "sets",
      target: 6,
      bestOf: 3,
      winBy: 2,
      period: "Set",
      periods: 3,
      description: "Game and set scoring."
    },

    "Rowing": {
      format: "time",
      target: 0,
      bestOf: 1,
      winBy: 1,
      period: "Race",
      periods: 1,
      description: "Record finishing times."
    },

    "Custom sport": {
      format: "points",
      target: 21,
      bestOf: 1,
      winBy: 1,
      period: "Round",
      periods: 1,
      description: "Configure your own scoring rules."
    }
  };

  function get(name) {
    return rules[name] || rules["Custom sport"];
  }

  function names() {
    return Object.keys(rules);
  }

  function apply(name) {
    return { ...get(name) };
  }

  return {
    rules,
    get,
    names,
    apply
  };

})();
