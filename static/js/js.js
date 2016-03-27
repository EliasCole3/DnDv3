"use strict";

$(function () {
  ebot.insertModalHtml("modal-lg");
  abc.initialize();
  // ebot.updateDocumentation(abc)
});

var abc = {

  initialize: function initialize() {
    abc.socket = io();
    abc.handlersSocketEventReceived();
    abc.makeRightDrawer();

    // this is a try block because the data doesn't always parse right, if the page is refreshed
    // instead of newly navigated to.
    try {
      var user = JSON.parse($("#data-for-you").html());
      console.log(user);

      abc.setCurrentPlayerCharacterId(user);

      var DMs = ["a", "bliss"];
      var players = ["a", "b", "c", "bliss", "laurana", "andros", "skjor", "greg", "ares", "wild"];

      if (DMs.indexOf(user.local.username) > -1) {
        abc.userIsDM = true;
      }

      if (players.indexOf(user.local.username) > -1) {
        abc.userIsPlayer = true;
      }

      if (!abc.userIsDM && !abc.userIsPlayer) {
        alert("Unauthorized user detected. Self destruct sequence initiated.");
      }

      $.when.apply($, abc.retrieveInitialModels()).done(function () {
        // abc.fillTopDrawer()
        abc.fillRightDrawer();
        // abc.fillLeftDrawer()
        // abc.fillBottomDrawer()
      });

      abc.addPlayerCursorDivs();

      abc.handlerMouseMove();
    } catch (e) {
      console.log("error parsing authentication data: " + e);
    }
  },

  addPlayerCursorDivs: function addPlayerCursorDivs() {
    //currently hardcoded in index.ejs
  },

  handlerMouseMove: function handlerMouseMove() {
    $('body').on('mousemove', function (e) {
      if (abc.cursorsVisible) {
        abc.socket.emit('cursor moved', { playerId: abc.currentPlayerCharacterId, x: e.pageX, y: e.pageY });
      }
    });
  },

  updateCursorImage: function updateCursorImage(emitObj) {
    console.log(emitObj);
    if (abc.cursorDelay === 10) {
      $("#cursor-" + emitObj.playerId).css("top", emitObj.y).css("left", emitObj.x);
      abc.cursorDelay = 0;
    } else {
      abc.cursorDelay++;
    }
  },

  setCurrentPlayerCharacterId: function setCurrentPlayerCharacterId(user) {

    switch (user.local.username) {
      case "laurana":
        abc.currentPlayerCharacterId = 1;
        break;
      case "andros":
        abc.currentPlayerCharacterId = 2;
        break;
      case "skjor":
        abc.currentPlayerCharacterId = 3;
        break;
      case "greg":
        abc.currentPlayerCharacterId = 4;
        break;
      case "ares":
        abc.currentPlayerCharacterId = 5;
        break;
      case "wild":
        abc.currentPlayerCharacterId = 8;
        break;
      case "bliss":
        abc.currentPlayerCharacterId = 0;
        break;
      default:
        console.log("setCurrentPlayerCharacterId() fell out of switch statement. Current user:");
        console.log(user);
    }
  },

  handlersSocketEventReceived: function handlersSocketEventReceived() {

    abc.socket.on('element dragged', function (emitObj) {
      $('#' + emitObj.id).css("top", emitObj.y);
      $('#' + emitObj.id).css("left", emitObj.x);
    });

    abc.socket.on('element resized', function (emitObj) {
      $("#" + emitObj.id).css("width", emitObj.width).css("height", emitObj.height);
    });

    abc.socket.on('user connected', function () {
      // abc.playSound("me-user-connected")
    });

    abc.socket.on('user disconnected', function () {
      // abc.playSound("me-user-disconnected")
    });

    abc.socket.on('item token added', function (emitObj) {
      abc.addTokenItem(emitObj.imageFilename, emitObj.ranTop, emitObj.ranLeft);
    });

    abc.socket.on('player character token added', function (emitObj) {
      abc.addTokenPlayerCharacter(emitObj.imageFilename, emitObj.ranTop, emitObj.ranLeft);
    });

    abc.socket.on('creature token added', function (emitObj) {
      abc.addTokenCreature(emitObj.imageFilename, emitObj.ranTop, emitObj.ranLeft, emitObj.id);
    });

    abc.socket.on('background changed', function (emitObj) {
      abc.changeBackground(emitObj.background);
    });

    abc.socket.on('hp changed', function (emitObj) {
      abc.changeHp(emitObj.id, emitObj.val);
    });

    abc.socket.on('cursor moved', function (emitObj) {
      abc.updateCursorImage(emitObj);
    });

    abc.socket.on('cursors toggle visibility', function (emitObj) {
      abc.toggleCursorsVisibility(emitObj.cursorsVisible);
      abc.cursorsVisible = emitObj.cursorsVisible;
    });

    abc.socket.on('reload top drawer', function () {
      // abc.reloadTopDrawer()
    });

    abc.socket.on('core', function (obj) {
      //branching logic based on what is in the object

      // console.log(obj)

      if (obj.event === "create-turn-counter") {
        abc.createTurnCounter();
      }

      if (obj.event === "increment-turn") {
        var currentTurn = +$("#tc-current-turn").text();
        $("#tc-current-turn").text(++currentTurn);
      }

      if (obj.event === "decrement-turn") {
        var currentTurn = +$("#tc-current-turn").text();
        $("#tc-current-turn").text(--currentTurn);
      }

      if (obj.event === "add-row-to-turn-counter") {
        abc.addRowToTurnCounter(obj.randId);
      }

      if (obj.event === "remove-turn-counter-row") {
        $("tr[id=tc-" + obj.randId + "]").remove();
      }

      if (obj.event === "update-turn-counter-row-values") {
        $(".td-name[id=tc-name-" + obj.randId + "]").html(obj.updatedName);
        $(".td-initiative[id=tc-initiative-" + obj.randId + "]").html(obj.updatedInitiative);
        $(".td-count[id=tc-count-" + obj.randId + "]").html(obj.updatedCount);
      }

      if (obj.event === "creature-table-remove-row") {
        abc.removeToken(obj.tokenId);
      }

      if (obj.event === "add-custom-token") {
        abc.addCustomToken(obj.imageFilename, obj.ranTop, obj.ranLeft, obj.height, obj.width, obj.opacity);
      }
    });
  },

  removeToken: function removeToken(tokenId) {
    $("#dynamically-added-div-" + tokenId).remove();
  },

  retrieveInitialModels: function retrieveInitialModels() {
    var deferreds = [];

    deferreds.push(ebot.retrieveEntity(abc, "items"));
    deferreds.push(ebot.retrieveEntity(abc, "powers"));
    deferreds.push(ebot.retrieveEntity(abc, "creatures"));
    deferreds.push(ebot.retrieveEntity(abc, "playerCharacters"));
    deferreds.push(ebot.retrieveEntity(abc, "nonPlayerCharacters"));
    deferreds.push(ebot.retrieveEntity(abc, "joinPlayerCharacterItems"));
    deferreds.push(ebot.retrieveEntity(abc, "joinPlayerCharacterPowers"));
    deferreds.push(ebot.retrieveEntity(abc, "characterDetails"));

    return deferreds;
  },

  toggleCursorsVisibility: function toggleCursorsVisibility(cursorsVisible) {
    if (!cursorsVisible) {
      $(".cursor").velocity({ opacity: 0 }, { duration: 1000 }).velocity({ display: "none" }, { duration: 0 });
    } else {
      $(".cursor").velocity({ display: "block" }, { duration: 0 }).velocity({ opacity: .95 }, { duration: 1000 });
    }
  },

  fillRightDrawer: function fillRightDrawer() {
    if (abc.userIsDM) {
      $("#right-drawer-contents").html(abc.getRightDrawerHtmlDM());
      abc.handlerRightDrawerContentsDM();
    } else if (abc.userIsPlayer) {
      $("#right-drawer-contents").html(abc.getRightDrawerHtmlPlayer());
      abc.handlerRightDrawerContentsPlayer();
    } else {
      $("#right-drawer-contents").html("Unauthorized user detected!");
    }
  },

  getRightDrawerHtmlCommon: function getRightDrawerHtmlCommon() {
    var htmlString = "";

    htmlString += "\n    <button id='toggle-lines' class='btn btn-md btn-info'>Toggle Lines</button> \n    <br><br>\n\n\n\n    ";

    return htmlString;
  },

  getRightDrawerHtmlDM: function getRightDrawerHtmlDM() {
    var htmlString = "";

    return htmlString;
  },

  getRightDrawerHtmlPlayer: function getRightDrawerHtmlPlayer() {
    var htmlString = "";

    return htmlString;
  },

  handlerRightDrawerContentsCommon: function handlerRightDrawerContentsCommon() {},

  handlerRightDrawerContentsDM: function handlerRightDrawerContentsDM() {},

  handlerRightDrawerContentsPlayer: function handlerRightDrawerContentsPlayer() {},

  changeBackground: function changeBackground(background) {
    if (background !== "blank") {

      $("#wrapper").velocity({ opacity: 0 }, { duration: 1000, complete: function complete() {
          $("#wrapper").css("background-image", "url(images/backgrounds/" + background + ")").css("background-repeat", "no-repeat");
        } }).velocity({ opacity: 1 }, { duration: 1000 });
    } else {
      $("#wrapper").css("background-image", "");
    }
  },

  changeHp: function changeHp(id, val) {
    $("#" + id).val(val);
  },

  viewAllPowers: function viewAllPowers() {
    var htmlString = "";

    abc.powers.forEach(function (power) {
      htmlString += "\n      <div>\n\n        <h4>" + power.name + "</h4>\n        Type: " + power.type + " <br>\n        Attack Type: " + power.attackType + " <br>\n        Damage: " + power.damage + " <br>\n        Effect: " + power.effect + " <br>\n        Description: " + power.description + " <br>\n        Flavor: " + power.flavorText + " <br>\n        Upgrade Effects: " + power.upgrade + " <br>\n\n      </div><br><br>";
    });

    return htmlString;
  },

  viewAllPowersImproved: function viewAllPowersImproved() {
    var htmlString = "";

    htmlString += "<br><br>";

    htmlString += "\n      <label class=\"radio-inline\">\n        <input type=\"radio\" name=\"power-filter-radio\" id=\"name\" value=\"name\"> Title\n      </label> \n      <label class=\"radio-inline\">\n        <input type=\"radio\" name=\"power-filter-radio\" id=\"type\" value=\"type\"> Type\n      </label>\n      <label class=\"radio-inline\">\n        <input type=\"radio\" name=\"power-filter-radio\" id=\"attack-type\" value=\"attackType\"> Attack Type\n      </label>\n\n      <br>\n\n      <input id='filter-text'>\n      <button id='filter' class='btn btn-sm'>Filter</button>\n\n      <br>\n\n      <select id='character-filter' class='form-control'>\n        <option value=''>All</option>\n        <option value='1'>Laurana Lightbrand</option>\n        <option value='2'>Andros Vexstine</option>\n        <option value='3'>Skjor the Scarred</option>\n        <option value='4'>Greg Symbol</option>\n        <option value='5'>Ares Icharyd</option>\n        <option value='8'>WildKat</option>\n        <option value='9'>Scree Lo Tal</option>\n      </select>\n\n      <label>Current Powers Shown:\n        <div id='count-powers'>" + abc.powers.length + "</div>\n      </label>\n\n      <br><br>\n\n      <div id='powers'>\n    ";

    var uniqueTypes = ebot.getUniqueFields(abc.powers, 'type');

    abc.powers.forEach(function (power) {
      htmlString += "\n      <div class='power-view'>\n\n        <b>" + power.name + "</b> <br>\n        Type: " + power.type + " <br>\n        Attack Type: " + power.attackType + " <br>\n        Damage: " + power.damage + " <br>\n        Effect: " + power.effect + " <br>\n        Description: " + power.description + " <br>\n        Flavor: " + power.flavorText + " <br>\n        Upgrade Effects: " + power.upgrade + " <br>\n\n      </div>";
    });

    htmlString += "</div>";

    return htmlString;
  },

  handlerAllPowersImproved: function handlerAllPowersImproved() {
    $("#filter").click(function (e) {
      var htmlString = "";
      var filterText = $("#filter-text").val();
      var countPowers = 0;

      var propOnWhichToFilter = $('input:radio[name=power-filter-radio]:checked').val();
      console.log(propOnWhichToFilter);

      if (filterText === '' || filterText === null) {
        htmlString += abc.viewAllPowersJustPowers();
        countPowers = abc.powers.length;
      } else {
        abc.powers.forEach(function (power) {
          // if(power.type.indexOf(filterText) > -1) {
          console.log(power);
          console.log(power[propOnWhichToFilter]);
          if (power[propOnWhichToFilter].indexOf(filterText) > -1) {
            countPowers++;
            htmlString += "\n            <div class='power-view'>\n\n              <b>" + power.name + "</b> <br>\n              Type: " + power.type + " <br>\n              Attack Type: " + power.attackType + " <br>\n              Damage: " + power.damage + " <br>\n              Effect: " + power.effect + " <br>\n              Description: " + power.description + " <br>\n              Flavor: " + power.flavorText + " <br>\n              Upgrade Effects: " + power.upgrade + " <br>\n\n            </div>";
          }
        });
      }

      $("#powers").html(htmlString);
      $('#count-powers').html(countPowers);
    });

    $("#character-filter").change(function (e) {
      var element = $(e.currentTarget);
      var playerCharacterId = element.val();
      var countPowers = 0;
      var htmlString = "";

      if (playerCharacterId === '') {
        htmlString += abc.viewAllPowersJustPowers();
        countPowers = abc.powers.length;
      } else {
        var relevantPowerJoins = abc.joinPlayerCharacterPowers.filter(function (join) {
          return join.playerCharacterId == playerCharacterId;
        });

        relevantPowerJoins.forEach(function (join) {
          countPowers++;
          var relevantPower = abc.powers.filter(function (power) {
            return power.powerId == join.powerId;
          })[0];

          htmlString += "\n            <div class='power-view'>\n\n              <b>" + relevantPower.name + "</b> <br>\n              Type: " + relevantPower.type + " <br>\n              Attack Type: " + relevantPower.attackType + " <br>\n              Damage: " + relevantPower.damage + " <br>\n              Effect: " + relevantPower.effect + " <br>\n              Description: " + relevantPower.description + " <br>\n              Flavor: " + relevantPower.flavorText + " <br>\n              Upgrade Effects: " + relevantPower.upgrade + " <br>\n\n            </div>";
        });
      }

      $("#powers").html(htmlString);
      $('#count-powers').html(countPowers);
    });
  },

  viewAllPowersJustPowers: function viewAllPowersJustPowers() {
    var htmlString = "";

    abc.powers.forEach(function (power) {
      htmlString += "\n      <div class='power-view'>\n\n        <b>" + power.name + "</b> <br>\n        Type: " + power.type + " <br>\n        Attack Type: " + power.attackType + " <br>\n        Damage: " + power.damage + " <br>\n        Effect: " + power.effect + " <br>\n        Description: " + power.description + " <br>\n        Flavor: " + power.flavorText + " <br>\n        Upgrade Effects: " + power.upgrade + " <br>\n\n      </div>";
    });

    return htmlString;
  },

  viewHelpfulInfo: function viewHelpfulInfo() {
    var htmlString = "";

    htmlString += "\n    <img src='images/miscellaneous/ability-modifiers.png'>\n    <br><br>\n    <img src='images/miscellaneous/skill-table.jpg'>\n    <br><br>\n\n    <br> Level 2 - 2 Defense points, +1 Base damage\n    <br> Level 3 - Power point + 2 x To hit +1\n    <br> Level 4 - Base damage +2\n    <br> Level 5 - +3 Ability Score, Power point\n    <br> Level 6 - 2 Defense points, +1 Base damage\n    <br> Level 7 - Power point\n    <br> Level 8 - 2 Defense points\n    <br> Level 9 - 2 x To hit +1\n    <br> Level 10 - +1 Action point, 1 Power point, +3 Ability Score, Choose: Initiative +4, Speed +1, +3 Base damage\n\n    \n    ";

    return htmlString;
  },

  addTokenItem: function addTokenItem(imageFilename, ranTop, ranLeft) {

    //I'm a bad person. Fix this
    var effects = ['poison.jpg', 'ice.jpg', 'fire.jpg', 'immobile.gif', 'prone.gif'];
    var id = "dynamically-added-div-" + abc.currentDynamicDivId;
    var htmlString = "";
    if (effects.indexOf(imageFilename) > -1) {
      htmlString = "<div id='" + id + "' style='position:absolute; top:" + ranTop + "px; left:" + ranLeft + "px; width: 50px; height: 50px; opacity: 0.4;'><img src='images/items/" + imageFilename + "'></div>";
    } else {
      htmlString = "<div id='" + id + "' style='position:absolute; top:" + ranTop + "px; left:" + ranLeft + "px; width: 50px; height: 50px;'><img src='images/items/" + imageFilename + "'></div>";
    }
    $("#wrapper").append(htmlString);
    $("#" + id).draggable(abc.draggableOptionsToken);
    abc.currentDynamicDivId++;
  },

  addTokenPlayerCharacter: function addTokenPlayerCharacter(imageFilename, ranTop, ranLeft) {
    var id = "dynamically-added-div-" + abc.currentDynamicDivId;
    var htmlString = "<div id='" + id + "' style='position:absolute; top:" + ranTop + "px; left:" + ranLeft + "px; width: 50px; height: 50px;'><img src='images/player-characters/" + imageFilename + "'></div>";
    $("#wrapper").append(htmlString);
    $("#" + id).draggable(abc.draggableOptionsToken);
    abc.currentDynamicDivId++;
  },

  addTokenCreature: function addTokenCreature(imageFilename, ranTop, ranLeft, creatureId) {
    var id = "dynamically-added-div-" + abc.currentDynamicDivId;
    var htmlString = "<div id='" + id + "' token-id='" + abc.currentDynamicDivId + "' style='position:absolute; top:" + ranTop + "px; left:" + ranLeft + "px; width: 50px; height: 50px;'><img src='images/creatures/" + imageFilename + "'></div>";
    $("#wrapper").append(htmlString);
    $("#" + id).draggable(abc.draggableOptionsToken);

    if (!abc.creatureTableCreated && abc.userIsDM) {
      abc.createCreatureTable();
    }

    // testing to make sure I had unique local copies of the creatures
    // $(`#${id}`).on("click", e => {
    //   let element = $(e.currentTarget)
    //   let tokenId = +element.attr('token-id')
    //   let creature = abc.activeCreatures.filter(aCreature => {
    //     return aCreature.tokenId === tokenId
    //   })[0]

    //   console.log(creature.hp)

    // })

    var newCopy = abc.getCreature(creatureId);

    newCopy.tokenId = abc.currentDynamicDivId;

    abc.activeCreatures.push(newCopy);

    if (abc.userIsDM) {
      abc.addCreatureToCreatureTable(newCopy);
    }

    abc.currentDynamicDivId++;
  },

  addCustomToken: function addCustomToken(imageFilename, ranTop, ranLeft, height, width, opacity) {
    var id = "dynamically-added-div-" + abc.currentDynamicDivId;
    var htmlString = "<div id='" + id + "' style='position:absolute; top:" + ranTop + "px; left:" + ranLeft + "px; width: " + width + "px; height: " + height + "px; opacity: " + opacity + ";'><img src='images/custom/" + imageFilename + "'></div>";
    $("#wrapper").append(htmlString);
    $("#" + id).draggable(abc.draggableOptionsToken);
    abc.currentDynamicDivId++;
  },

  makeRightDrawer: function makeRightDrawer() {
    abc.drawerify({
      fromThe: "right",
      selector: "#right-drawer",
      contents: "#right-drawer-contents",
      opacity: 0.9
    });
  },

  createTurnCounter: function createTurnCounter() {
    $('#wrapper').append(abc.createTurnCounterHtml());
    abc.handlerTurnCounter();
  },

  createTurnCounterHtml: function createTurnCounterHtml() {
    var htmlString = "";

    if (abc.userIsDM) {
      htmlString += "\n      <div id='turn-counter-container' class=''>\n\n        <label>Current Turn:</label>\n        <span id='tc-current-turn'>0</span>\n        <button id='tc-decrement-turn' class='btn btn-sm'><i class='glyphicon glyphicon-minus'></i></button>\n        <button id='tc-increment-turn' class='btn btn-sm'><i class='glyphicon glyphicon-plus'></i></button>\n        <button id='tc-add-row' class='btn btn-sm'>Add Row</button>\n        <br>\n\n        <table id='turn-counter-table' class='table-condensed'>\n          <tr id='tc-header-row'>\n            <th>Name</th>\n            <th>Initiative</th>\n            <th>Count</th>\n            <th></th>\n            <th></th>\n          </tr>\n          \n        </table>\n      </div>";
    } else {
      htmlString += "\n      <div id='turn-counter-container' class=''>\n\n        <label>Current Turn:</label>\n        <span id='tc-current-turn'>0</span>\n        <br>\n\n        <table id='turn-counter-table' class='table-condensed'>\n          <tr id='tc-header-row'>\n            <th>Name</th>\n            <th>Initiative</th>\n            <th>Count</th>\n            <th></th>\n            <th></th>\n          </tr>\n          \n        </table>\n      </div>";
    }

    return htmlString;
  },

  addRowToTurnCounter: function addRowToTurnCounter(randId) {
    $('#turn-counter-table').append(abc.createTurnCounterRowHtml(randId));

    if (abc.userIsDM) {
      $('.tc-edit-row').off('click');
      $('.tc-remove-row').off('click');

      $('.tc-edit-row').on('click', function (e) {
        var element = $(e.currentTarget);
        var randId = element.attr('rand-id');
        var currentlyEditIcon = $("button[rand-id='" + randId + "'][class~=tc-edit-row]").attr('currently-edit-icon');

        if (currentlyEditIcon === 'true') {
          //everything is normal. Change everything to inputs
          var currentName = $(".td-name[id=tc-name-" + randId + "]").text();
          var currentInitiative = $(".td-initiative[id=tc-initiative-" + randId + "]").text();
          var currentCount = $(".td-count[id=tc-count-" + randId + "]").text();

          $(".td-name[id=tc-name-" + randId + "]").html("<input id='temp-input-name' class='temp-input' value='" + currentName + "'>");
          $(".td-initiative[id=tc-initiative-" + randId + "]").html("<input id='temp-input-initiative' class='temp-input' value='" + currentInitiative + "'>");
          $(".td-count[id=tc-count-" + randId + "]").html("<input id='temp-input-count' class='temp-input' value='" + currentCount + "'>");

          $("button[rand-id='" + randId + "'][class~=tc-edit-row]").html("<i class='glyphicon glyphicon-floppy-disk'></i>");
          $("button[rand-id='" + randId + "'][class~=tc-edit-row]").attr('currently-edit-icon', 'false');
        } else {
          //info was just updated, retrieve it and put things back to normal

          var updatedName = $("#temp-input-name").val();
          var updatedInitiative = $("#temp-input-initiative").val();
          var updatedCount = $("#temp-input-count").val();

          abc.toSocket({
            event: 'update-turn-counter-row-values',
            randId: randId,
            updatedName: updatedName,
            updatedInitiative: updatedInitiative,
            updatedCount: updatedCount
          });

          $("button[rand-id='" + randId + "'][class~=tc-edit-row]").html("<i class='glyphicon glyphicon-edit'></i>");
          $("button[rand-id='" + randId + "'][class~=tc-edit-row]").attr('currently-edit-icon', 'true');
        }
      });

      $('.tc-remove-row').on('click', function (e) {
        var element = $(e.currentTarget);
        var randId = element.attr('rand-id');
        abc.toSocket({ event: 'remove-turn-counter-row', randId: randId });
      });
    }
  },

  handlerTurnCounter: function handlerTurnCounter() {

    $('#turn-counter-container').draggable().resizable();

    $('#tc-add-row').click(function (e) {
      var randId = ebot.getRandomInt(100000, 999999);
      abc.toSocket({ event: 'add-row-to-turn-counter', randId: randId });
    });

    $("#tc-increment-turn").click(function (e) {
      abc.toSocket({ event: 'increment-turn' });
    });

    $("#tc-decrement-turn").click(function (e) {
      abc.toSocket({ event: 'decrement-turn' });
    });
  },

  createTurnCounterRowHtml: function createTurnCounterRowHtml(randId) {
    var htmlString = "";

    if (abc.userIsDM) {
      htmlString += "\n      <tr id='tc-" + randId + "'>\n        <td id='tc-name-" + randId + "' class='td-name'>asdf</td>\n        <td id='tc-initiative-" + randId + "' class='td-initiative'></td>\n        <td id='tc-count-" + randId + "' class='td-count'>1</td>\n        <td><button class='btn btn-sm tc-edit-row' rand-id='" + randId + "' currently-edit-icon='true'><i class='glyphicon glyphicon-edit'></i></button></td>\n        <td><button class='btn btn-sm tc-remove-row' rand-id='" + randId + "'><i class='glyphicon glyphicon-minus'></i></button></td>\n      </tr>";
    } else {
      htmlString += "\n      <tr id='tc-" + randId + "'>\n        <td id='tc-name-" + randId + "' class='td-name'>asdf</td>\n        <td id='tc-initiative-" + randId + "' class='td-initiative'></td>\n        <td id='tc-count-" + randId + "' class='td-count'>1</td>\n        <td></td>\n        <td></td>\n      </tr>";
    }

    return htmlString;
  },

  createCreatureTable: function createCreatureTable() {
    $('#wrapper').append(abc.createCreatureTableHtml());
    abc.handlerCreatureTable();
    abc.creatureTableCreated = true;
  },

  createCreatureTableHtml: function createCreatureTableHtml() {
    var htmlString = "";

    htmlString += "\n    <div id='creature-table-container'>\n      <button id='remove-creature-table' class='btn btn-md'><i class='glyphicon glyphicon-minus'></i></button>\n\n      <table id='creature-table' class='table-condensed'>\n        <tr id='ct-header-row'>\n          <th>Name</th>\n          <th>HP</th>\n          <th>Status</th>\n          <th></th>\n        </tr>\n      </table>\n\n    </div>";

    return htmlString;
  },

  handlerCreatureTable: function handlerCreatureTable() {
    $('#creature-table-container').draggable().resizable();

    $("#remove-creature-table").click(function (e) {
      $('#creature-table-container').remove();
    });
  },

  addCreatureToCreatureTable: function addCreatureToCreatureTable(creature) {
    var htmlString = "";

    htmlString += "\n    <tr id='' creature-id='" + creature._id + "' token-id='" + creature.tokenId + "'>\n      <td id='creature-table-name-" + creature.tokenId + "' class='creature-table-name'>" + creature.name + "</td>\n      <td id=''><input class='form-control creature-table-hp-input' creature-id='" + creature._id + "' type='number' value='" + creature.hp + "'></td>\n      <td id=''><input class='form-control creature-table-status'></td>\n      <td><button class='btn btn-sm ct-remove' token-id='" + creature.tokenId + "'><i class='glyphicon glyphicon-minus'></i></button></td>\n    </tr>";

    $('#creature-table').append(htmlString);

    $(".creature-table-hp-input").off("change").on("change", function (e) {
      var element = $(e.currentTarget);
      var creatureId = element.attr("creature-id");
      var val = element.val();

      var creature = abc.activeCreatures.filter(function (aCreature) {
        return aCreature._id === creatureId;
      })[0];

      creature.hp = val;
    });

    // $("#myElement").unbind('mouseenter mouseleave');
    // $('#myElement').off('hover');

    $("#creature-table tr").hover(function (e) {

      $("#creature-table tr").on({
        mouseenter: function mouseenter(e) {
          addBorderToToken(e, true);
        },
        mouseleave: function mouseleave(e) {
          addBorderToToken(e, false);
        }
      });

      function addBorderToToken(e, mouseEnter) {
        var tokenId = $(e.currentTarget).attr('token-id');
        if (tokenId !== undefined) {
          var borderString = mouseEnter ? 'solid gold 3px' : '';
          $("#dynamically-added-div-" + tokenId).css('border', borderString);
        }
      }

      var tooltipString = "";
      var propsToIgnore = ['_id', 'imageFilename', '__v', 'tokenId', 'creatureId', 'level', 'xpValue', 'goldValue', 'race', 'name'];

      for (var prop in creature) {
        if (propsToIgnore.indexOf(prop) === -1) {
          tooltipString += prop + ": " + creature[prop] + "<br>";
        }
      }

      $("#creature-table-name-" + creature.tokenId).tooltip({
        placement: 'left',
        title: tooltipString,
        html: true
      });
    });

    $(".ct-remove").off('click').on('click', function (e) {
      var element = $(e.currentTarget);
      var tokenId = element.attr('token-id');
      abc.toSocket({
        event: 'creature-table-remove-row',
        tokenId: tokenId
      });
      $("tr[token-id=" + tokenId + "]").remove();
    });
  },

  /*
    Utilities
  */
  playSound: function playSound(sound) {
    var soundUnique = new Howl({
      urls: ["/sounds/" + sound + ".wav"]
    }).play();
  },

  draggableOptions: {
    drag: function drag(event, ui) {
      var emitObj = {
        id: ui.helper[0].id,
        x: $(ui.helper[0]).css("left"),
        y: $(ui.helper[0]).css("top")
      };

      abc.socket.emit('element dragged', emitObj);
    }
  },

  draggableOptionsToken: {
    drag: function drag(event, ui) {
      var emitObj = {
        id: ui.helper[0].id,
        x: $(ui.helper[0]).css("left"),
        y: $(ui.helper[0]).css("top")
      };

      abc.socket.emit('element dragged', emitObj);
    },
    grid: [50, 50]
  },

  //not currently being used
  resizableOptions: {
    resize: function resize(event, ui) {
      var emitObj = {
        id: ui.element[0].id,
        height: ui.size.height,
        width: ui.size.width
      };

      abc.socket.emit('element resized', emitObj);
    }
  },

  getCreature: function getCreature(creatureId) {
    var creature = abc.creatures.filter(function (creature) {
      return creature._id === creatureId;
    })[0];

    return abc.deepCopy(creature);
  },

  toSocket: function toSocket(obj) {
    abc.socket.emit('core', obj);
  },

  deepCopy: function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  drawerify: function drawerify(options) {
    var drawer = $(options.selector);
    var drawerContents = $(options.contents);
    var drawerVisible = false;
    var drawerHeight = drawer.height();
    var drawerWidth = drawer.width();

    drawer.after("<div id='drawer-handle-right' class='drawer-handle' style='top: " + (drawerHeight - drawerHeight * 0.1) + "px;right: 0px'><i class='glyphicon glyphicon-chevron-left'></i></div>").css("opacity", 0).css("width", "0px");

    drawerContents.css("opacity", 0).css("display", "none");

    var drawerHandleContainer = $("#drawer-handle-right");
    var drawerHandle = $("#drawer-handle-right i");

    $("#drawer-handle-right i").click(function () {
      if (!drawerVisible) {
        drawer.velocity({
          width: drawerWidth + "px",
          opacity: options.opacity
        }, {
          complete: function complete(elements) {
            drawerContents.css("display", "block");
            drawerContents.velocity({ opacity: options.opacity });
          }
        });
        drawerHandle.removeClass("glyphicon-chevron-left").addClass("glyphicon-chevron-right").velocity({
          right: drawerWidth + "px"
        });
        drawerVisible = true;
      } else {
        drawerContents.css("opacity", 0).css("display", "none");
        drawer.velocity({
          width: "0px",
          opacity: 0
        });
        drawerHandle.removeClass("glyphicon-chevron-right").addClass("glyphicon-chevron-left").velocity({
          right: "0px"
        });
        drawerVisible = false;
      }
    });
  },

  dragDelay: 1,

  dragCounter: 0,

  socket: {},

  currentDynamicDivId: 1,

  apiurl: "http://localhost:8082",
  // apiurl: "http://192.241.203.33:8082",

  userIsPlayer: false,

  userIsDM: false,

  currentPlayerCharacterId: 0,

  items: [],

  powers: [],

  creatures: [],

  playerCharacters: [],

  nonPlayerCharacters: [],

  joinPlayerCharacterItems: [],

  joinPlayerCharacterPowers: [],

  characterDetails: [],

  activeCreatures: [],

  cursorDelay: 0,

  cursorsVisible: true,

  creatureTableCreated: false,

  doNotInclude: ['npc', 'Ryland']

};
//# sourceMappingURL=js.js.map
