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

      var DMs = ["a", "bliss", "dash"];
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
        abc.fillRightDrawer();
      });

      abc.addPlayerCursorDivs();
      abc.trackMouse();
      abc.handlerMouseMove();

      var listener = new window.keypress.Listener();
      listener.simple_combo('alt d', function () {
        var theElementTheMouseIsOver = document.elementFromPoint(abc.mouseX, abc.mouseY);
        if (theElementTheMouseIsOver.hasAttribute('token-id')) {
          var tokenId = theElementTheMouseIsOver.getAttribute('token-id');
          abc.toSocket({
            event: 'remove-token',
            tokenId: tokenId
          });
          if (abc.creatureTableCreated) {
            $("tr[token-id=" + tokenId + "]").remove();
          }
        }
      });
    } catch (e) {
      console.log("error parsing authentication data: " + e);
    }
  },

  trackMouse: function trackMouse() {
    document.onmousemove = function (e) {
      abc.mouseX = e.clientX;
      abc.mouseY = e.clientY;
    };
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
    // console.log(emitObj)
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
        abc.currentPlayerName = 'ryland';
        break;
      case "andros":
        abc.currentPlayerCharacterId = 2;
        abc.currentPlayerName = 'dave';
        break;
      case "skjor":
        abc.currentPlayerCharacterId = 3;
        abc.currentPlayerName = 'josh';
        break;
      case "greg":
        abc.currentPlayerCharacterId = 4;
        abc.currentPlayerName = 'nick';
        break;
      case "ares":
        abc.currentPlayerCharacterId = 5;
        abc.currentPlayerName = 'izzy';
        break;
      case "wild":
        abc.currentPlayerCharacterId = 8;
        abc.currentPlayerName = 'jon';
        break;
      case "bliss":
        abc.currentPlayerCharacterId = 0;
        abc.currentPlayerName = 'elias';
        break;
      case "dash":
        abc.currentPlayerCharacterId = 99;
        abc.currentPlayerName = 'dave';
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

    abc.socket.on('core', function (obj) {
      //branching logic based on what is in the object

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

      if (obj.event === "message") {}

      if (obj.event === 'clear-all-tokens') {
        abc.clearAllTokens();
      }

      if (obj.event === 'clear-all-tokens-and-reset') {
        abc.clearAllTokens();
        abc.recreateTokens(obj.data);
      }

      if (obj.event === 'remove-token') {
        abc.removeToken(obj.tokenId);
      }
    });
  },

  handleMessage: function handleMessage(obj) {
    // console.log('message received: ')
    // console.log(obj)
    if (!obj.message) return;

    if (!abc.messageWindowCreated) abc.createMessageWindow();

    // if the player is sending a message to all, use their name
    if (obj.to === 'all') {
      $('#messages-from-all').append("<li class='message-li'><b>" + obj.from.capitalize() + "</b>: " + obj.message + "</li>");
    }

    // if a message was received intented for the player, add that message to the tab belonging to the sender
    if (obj.to === abc.currentPlayerName) {
      $("#messages-from-" + obj.from).append("<li class='message-li'><b>" + obj.from.capitalize() + "</b>: " + obj.message + "</li>");
    }

    // if the player sent the message and it wasn't going to the all channel, add the sender's message to the channel, so they can see what they said
    if (obj.from === abc.currentPlayerName && obj.to !== 'all') {
      $("#messages-from-" + obj.to).append("<li class='message-li'><b>Me</b>: " + obj.message + "</li>");
    }

    // if the message isn't coming from the current player, add a star to the tab of whoever sent it
    if (obj.from !== abc.currentPlayerName) {
      $("#tab-" + obj.from).html("<b>***" + obj.from.capitalize() + "***</b>");
    }

    // hacky way of scrolling to the bottom of the div when a new message is added
    $('.message-ul-wrapper').scrollTop(100000);
  },

  clearAllTokens: function clearAllTokens() {
    abc.activeCreatures.length = 0;
    abc.activeTokens.length = 0;
    $('.token').remove();
    abc.currentDynamicDivId = 1;
    if (abc.creatureTableCreated) {
      $('#remove-creature-table').click();
      abc.creatureTableCreated = false;
    }
  },

  recreateTokens: function recreateTokens(data) {
    data.forEach(function (token) {

      token.top = token.top.replace(/px/, '');
      token.left = token.left.replace(/px/, '');

      switch (token.creatingFunctionName) {
        case 'addTokenItem':
          abc.addTokenItem(token.imageFilename, token.top, token.left);
          break;

        case 'addTokenPlayerCharacter':
          abc.addTokenPlayerCharacter(token.imageFilename, token.top, token.left);
          break;

        case 'addTokenCreature':
          abc.addTokenCreature(token.imageFilename, token.top, token.left, token.creatureId);
          break;

        case 'addCustomToken':
          abc.addCustomToken(token.imageFilename, token.top, token.left, token.height, token.width, token.opacity);
          break;
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

    htmlString += "\n    <button id='toggle-lines' class='btn btn-md btn-info'>Toggle Lines</button> \n    <br><br>\n\n    <button id='show-all-powers' class='btn btn-md btn-info'>Show All Powers</button>\n    <br><br>\n\n    <button id='show-all-powers-improved' class='btn btn-md btn-info'>Show All Powers+</button>\n    <br><br>\n\n    <button id='helpful-info' class='btn btn-md btn-info'>Helpful Info</button>\n    <br><br>\n\n    <button id='old-character-sheets' class='btn btn-md btn-info'>Old Character Sheets</button>\n    <br><br>\n\n    <button id='messaging' class='btn btn-md btn-info'>Messaging</button>\n    <br><br>\n\n\n    ";

    return htmlString;
  },

  getRightDrawerHtmlDM: function getRightDrawerHtmlDM() {
    var htmlString = "";
    htmlString += abc.getRightDrawerHtmlCommon();

    htmlString += "\n    <select id='background-select' data-placeholder='Choose a background...'>\n      <option value=''></option>\n      <option value='blank'>Blank</option>\n      <option value='zone-map.png'>Zone Map</option>\n      <option value='river.jpg'>River</option>\n      <option value='twooth-library.png'>Twooth Library</option>\n      <option value='slime-cave.png'>Slime Cave</option>\n      <option value='andora-tavern.jpg'>Andora Tavern</option>\n      <option value='andora-gates.png'>Andora Gates</option>\n      <option value='andora.jpg'>Andora</option>\n      <option value='brement.jpg'>Brement</option>\n      <option value='dark-forest-1.jpg'>Dark Forest</option>\n      <option value='desert-1.JPG'>Desert 1</option>\n      <option value='desert-statue.jpg'>Desert Statue</option>\n      <option value='dunkar.jpg'>Dunkar</option>\n      <option value='forest-path-1.jpg'>Forest Path 1</option>\n      <option value='forest-path-2.jpg'>Forest Path 2</option>\n      <option value='forest-1.JPG'>Forest 1</option>\n      <option value='plains-1.jpg'>Plains 1</option>\n      <option value='plains-2.jpg'>Plains 2</option>\n      <option value='spider-den.jpg'>Spider Den</option>\n      <option value='twooth.jpg'>Twooth</option>\n      <option value='ameretis-flashback-1.jpg'>Flashback 1</option>\n    </select>\n    <br><br>\n\n    <button id='toggle-cursor-visibility' class='btn btn-md btn-info'>toggle cursors</button>\n    <br><br>\n\n    <button id='token-window' class='btn btn-md btn-info'>Tokens</button>\n    <br><br>\n\n    <button id='clear-all-tokens' class='btn btn-md btn-info'>Clear All Tokens</button>\n    <br><br>\n\n    <button id='reset-tokens' class='btn btn-md btn-info'>Reset All Tokens To Mine</button>\n    <br><br>\n\n    ";

    return htmlString;
  },

  getRightDrawerHtmlPlayer: function getRightDrawerHtmlPlayer() {
    var htmlString = "";
    htmlString += abc.getRightDrawerHtmlCommon();

    htmlString += "\n    <br><br><button id='show-backstory' class='btn btn-md btn-info'>Show My Backstory</button>\n    <br><br><button id='show-my-powers' class='btn btn-md btn-info'>Show My Powers</button>\n    ";

    return htmlString;
  },

  handlerRightDrawerContentsCommon: function handlerRightDrawerContentsCommon() {

    $("#toggle-lines").click(function (e) {
      if ($("#lines").css("opacity") === "0.3") {
        $("#lines").velocity({ opacity: "0" });
      } else {
        $("#lines").velocity({ opacity: "0.3" });
      }
    });

    $("#show-all-powers").click(function (e) {
      ebot.showModal("All Powers", abc.viewAllPowers());
    });

    $("#show-all-powers-improved").click(function (e) {
      ebot.showModal("All Powers+", abc.viewAllPowersImproved());
      abc.handlerAllPowersImproved();
    });

    $("#helpful-info").click(function (e) {
      ebot.showModal("Helpful Info", abc.viewHelpfulInfo());
    });

    $("#old-character-sheets").click(function (e) {
      // one of the new windows with all the stuff that went into the top drawer
      // ebot.showModal("Helpful Info", abc.viewHelpfulInfo())

      var options = {
        windowId: 'old-character-sheets',
        content: abc.getOldCharacterSheetWindowContent(),
        width: '1250px',
        height: '280px'
      };
      abc.createWindow(options);
      abc.handlerOldCharacterSheetWindow();
    });

    $("#messaging").click(function (e) {
      abc.createMessageWindow();
    });

    $('#clear-all-tokens').click(function (e) {
      abc.toSocket({ event: 'clear-all-tokens' });
    });

    $('#reset-tokens').click(function (e) {

      // update position of all tokens
      abc.activeTokens.forEach(function (token) {
        token.top = $("#dynamically-added-div-" + token.divId).css('top');
        token.left = $("#dynamically-added-div-" + token.divId).css('left');
      });

      // need to save the info, because it's about to be wiped on all clients
      // let activeTokens = abc.deepCopy(abc.activeTokens)

      // clear out everything
      abc.toSocket({
        event: 'clear-all-tokens-and-reset',
        data: abc.activeTokens
      });
    });
  },

  createMessageWindow: function createMessageWindow() {
    var options = {
      windowId: 'messaging',
      content: abc.getMessagingWindowContent(),
      width: '450px',
      height: '280px'
    };
    abc.createWindow(options);
    abc.handlerMessagingWindow();
    abc.messageWindowCreated = true;
  },

  handlerRightDrawerContentsDM: function handlerRightDrawerContentsDM() {
    abc.handlerRightDrawerContentsCommon();

    $("#background-select").chosen(ebot.chosenOptions).change(function (e) {
      var element = $(e.currentTarget);
      abc.changeBackground(element.val());
      abc.socket.emit('background changed', { background: element.val() });
    });

    $('#background_select_chosen').css('width', '100%');

    $("#toggle-cursor-visibility").on("click", function (e) {
      abc.cursorsVisible = !abc.cursorsVisible;
      abc.socket.emit('cursors toggle visibility', { cursorsVisible: abc.cursorsVisible });
    });

    $("#token-window").click(function (e) {
      var options = {
        windowId: 'add-tokens',
        content: abc.getTokenWindowContent(),
        width: '900px'
      };
      abc.createWindow(options);
      abc.handlerTokenWindow();
    });
  },

  handlerRightDrawerContentsPlayer: function handlerRightDrawerContentsPlayer() {
    abc.handlerRightDrawerContentsCommon();

    $("#show-backstory").click(function (e) {
      var detailText = abc.characterDetails.filter(function (detail) {
        return detail.playerCharacterId == abc.currentPlayerCharacterId;
      })[0].backstory;

      detailText = "<div style=\"white-space: pre-wrap;\">" + detailText + "</div>";

      ebot.showModal("Backstory", detailText);
    });

    $("#show-my-powers").click(function (e) {
      var htmlString = "";

      var relevantPowerJoins = abc.joinPlayerCharacterPowers.filter(function (join) {
        return join.playerCharacterId == abc.currentPlayerCharacterId;
      });

      relevantPowerJoins.forEach(function (join) {
        var relevantPower = abc.powers.filter(function (power) {
          return power.powerId == join.powerId;
        })[0];

        htmlString += "\n        <div class='power-view'>\n\n          <h4>" + relevantPower.name + "</h4>\n          Type: " + relevantPower.type + " <br>\n          Attack Type: " + relevantPower.attackType + " <br>\n          Damage: " + relevantPower.damage + " <br>\n          Effect: " + relevantPower.effect + " <br>\n          Description: " + relevantPower.description + " <br>\n          Flavor: " + relevantPower.flavorText + " <br>\n          Upgrade Effects: " + relevantPower.upgrade + " <br>\n\n        </div><br><br>";
      });

      ebot.showModal("My Powers", htmlString);
    });
  },

  createWindow: function createWindow(options) {

    options.windowId += '-window';

    if (!options.hasOwnProperty('width')) {
      options.width = '300px';
    }

    if (!options.hasOwnProperty('height')) {
      options.height = '485px';
    }

    var htmlString = "";

    // create the window html
    htmlString += "\n    <div id='" + options.windowId + "' class='window' style='width:" + options.width + "; height:" + options.height + "'>\n      <div id='window-close-" + options.windowId + "' class='window-close-button'><i class='glyphicon glyphicon-remove'></i></div><br>\n      " + options.content + "\n    </div>";

    // add the window to the page
    $('#wrapper').append(htmlString);

    // make the window draggable and resizable
    $("#" + options.windowId).draggable().resizable();

    // enable the close functionality
    $("#window-close-" + options.windowId).click(function (e) {
      $("#" + options.windowId).remove();
      if (options.closeCallback) options.closeCallback();
    });
  },

  getTokenWindowContent: function getTokenWindowContent() {
    var htmlString = "";

    abc.items.forEach(function (item) {
      htmlString += "<button class='add-item-button' item-id='" + item._id + "' item-image-filename='" + item.imageFilename + "'><img src='images/items/" + item.imageFilename + "'></button>";
    });

    htmlString += "<br><br><br>";

    abc.playerCharacters.forEach(function (pc) {
      htmlString += "<button class='add-player-character-button' player-character-id='" + pc._id + "' player-character-image-filename='" + pc.imageFilename + "'><img src='/images/player-characters/" + pc.imageFilename + "'></button>";
    });

    htmlString += "<br><br><br>";

    abc.creatures.forEach(function (creature) {
      htmlString += "<button class='add-creature-button' creature-id='" + creature._id + "' creature-image-filename='" + creature.imageFilename + "'><img src='/images/creatures/" + creature.imageFilename + "'></button>";
    });

    htmlString += "<br><br><br>";

    // add-custom-token
    htmlString += "\n      blizzard: <button class='add-custom-token' image-filename='blizzard.png' token-height='150' token-width='150' opacity='.5'><img height='50' width='50' src='/images/custom/blizzard.png'></button>\n      caution: <button class='add-custom-token' image-filename='caution.png' token-height='100' token-width='100' opacity='.5'><img height='50' width='50' src='/images/custom/caution.png'></button>\n      sorrow: <button class='add-custom-token' image-filename='sorrow.png' token-height='150' token-width='150' opacity='.5'><img height='50' width='50' src='/images/custom/sorrow.png'></button>\n      heals: <button class='add-custom-token' image-filename='green3.png' token-height='150' token-width='150' opacity='.5'><img height='50' width='50' src='/images/custom/green3.png'></button>\n    ";

    return htmlString;
  },

  handlerTokenWindow: function handlerTokenWindow() {

    $(".add-item-button").click(function (e) {
      var button = $(e.currentTarget);
      var imageFilename = button.attr("item-image-filename");
      var ranTop = ebot.getRandomInt(2, 10) * 50;
      var ranLeft = ebot.getRandomInt(2, 10) * 50;
      abc.addTokenItem(imageFilename, ranTop, ranLeft);

      var emitObj = {
        imageFilename: imageFilename,
        ranTop: ranTop,
        ranLeft: ranLeft
      };

      abc.socket.emit('item token added', emitObj);
    });

    $(".add-player-character-button").click(function (e) {
      var button = $(e.currentTarget);
      var imageFilename = button.attr("player-character-image-filename");
      var ranTop = ebot.getRandomInt(2, 10) * 50;
      var ranLeft = ebot.getRandomInt(2, 10) * 50;
      abc.addTokenPlayerCharacter(imageFilename, ranTop, ranLeft);

      var emitObj = {
        imageFilename: imageFilename,
        ranTop: ranTop,
        ranLeft: ranLeft
      };

      abc.socket.emit('player character token added', emitObj);
    });

    $(".add-creature-button").click(function (e) {
      var button = $(e.currentTarget);
      var imageFilename = button.attr("creature-image-filename");
      var id = button.attr("creature-id");
      var ranTop = ebot.getRandomInt(2, 10) * 50;
      var ranLeft = ebot.getRandomInt(2, 10) * 50;
      abc.addTokenCreature(imageFilename, ranTop, ranLeft, id);

      var emitObj = {
        imageFilename: imageFilename,
        ranTop: ranTop,
        ranLeft: ranLeft,
        id: id
      };

      abc.socket.emit('creature token added', emitObj);
    });

    $(".add-custom-token").click(function (e) {
      var button = $(e.currentTarget);
      var imageFilename = button.attr("image-filename");
      var ranTop = ebot.getRandomInt(2, 10) * 50;
      var ranLeft = ebot.getRandomInt(2, 10) * 50;
      var height = button.attr("token-height");
      var width = button.attr("token-width");
      var opacity = button.attr("opacity");
      // abc.addCustomToken(imageFilename, ranTop, ranLeft, height, width)

      var emitObj = {
        event: 'add-custom-token',
        imageFilename: imageFilename,
        ranTop: ranTop,
        ranLeft: ranLeft,
        height: height,
        width: width,
        opacity: opacity
      };

      abc.toSocket(emitObj);
    });
  },

  getOldCharacterSheetWindowContent: function getOldCharacterSheetWindowContent() {
    var htmlString = "";

    htmlString += "<table id='player-stats-table' class=\"table-condensed\">";

    htmlString += "<tr>\n      <th>Player Name</th>\n      <th>Character Name</th>\n      <th>Current HP</th>\n      <th>Max HP</th>\n      <th>AC</th>\n      <th>Will</th>\n      <th>Reflex</th>\n      <th>To Hit AC/Will/Reflex</th>\n      <th>Damage Mod</th>\n      <th>Speed</th>\n      <th>Initiative</th>\n      <th>Action Points</th>\n      <th>Gold</th>\n      <th>Str</th>\n      <th>Con</th>\n      <th>Int</th>\n      <th>Wis</th>\n      <th>Dex</th>\n      <th>Cha</th>\n    </tr>";

    abc.playerCharacters.forEach(function (player) {
      if (abc.doNotInclude.indexOf(player.playerName) === -1) {
        htmlString += "<tr>\n          <td>" + player.playerName + "</td>\n          <td>" + player.characterName + "</td>\n          <td><input id='current-hp-input-" + player.playerCharacterId + "' class='current-hp-input form-control' type='number' value='" + player.hp + "'></td>\n          <td>" + player.hp + "</td>\n          <td>" + player.ac + "</td>\n          <td>" + player.will + "</td>\n          <td>" + player.reflex + "</td>\n          <td style=\"text-align:center;\">" + player.baseToHitAc + "/" + player.baseToHitWill + "/" + player.baseToHitReflex + "</td>\n          <td>" + player.damageModifier + "</td>\n          <td>" + player.speed + "</td>\n          <td>" + player.initiative + "</td>\n          <td>" + player.actionPoints + "</td>\n          <td>" + player.gold + "</td>\n          <td>" + player.strength + "</td>\n          <td>" + player.constitution + "</td>\n          <td>" + player.intelligence + "</td>\n          <td>" + player.wisdom + "</td>\n          <td>" + player.dexterity + "</td>\n          <td>" + player.charisma + "</td>\n\n        </tr>";
      }
    });

    htmlString += "</table>";

    return htmlString;
  },

  handlerOldCharacterSheetWindow: function handlerOldCharacterSheetWindow() {
    $(".current-hp-input").off("change");

    $(".current-hp-input").on("change", function (e) {
      var element = $(e.currentTarget);
      var id = element.attr("id");
      var val = element.val();
      abc.socket.emit('hp changed', { id: id, val: val });
    });
  },

  getMessagingWindowContent: function getMessagingWindowContent() {
    var players = ['all', 'dave', 'elias', 'izzy', 'josh', 'nick']; // this should be more global
    var htmlString = "";

    htmlString += "<ul id=\"tabs\" class=\"nav nav-tabs\" role=\"tablist\">";
    players.forEach(function (player) {
      htmlString += "\n        <li role=\"presentation\" class=\"tabs\"><a id=\"tab-" + player + "\" class='messaging-tab' data-player='" + player + "' href=\"#pane-" + player + "\" aria-controls=\"pane-" + player + "\" role=\"tab\" data-toggle=\"tab\">" + player.capitalize() + "</a></li>\n      ";
    });
    htmlString += "</ul>";

    htmlString += "<div class=\"tab-content\">";
    players.forEach(function (player) {
      htmlString += "\n      <div id=\"pane-" + player + "\" class=\"tab-pane fade active\" role=\"tabpanel\">\n        <div class='message-ul-wrapper'>\n          <ul id='messages-from-" + player + "'></ul>\n        </div>\n        <div id='messaging-controls-" + player + "' class='messaging-controls'>\n          <input id='messages-to-send-" + player + "' class='messages-to-send' data-player='" + player + "'>\n          <button id='send-message-" + player + "' data-from='" + abc.currentPlayerName + "' data-to='" + player + "' class='btn btn-sm messages-send-button'>Send</button>\n        </div>\n      </div>";
    });
    htmlString += "</div>";

    return htmlString;
  },

  handlerMessagingWindow: function handlerMessagingWindow() {

    var players = ['all', 'dave', 'elias', 'izzy', 'josh', 'nick']; // this should be more global

    players.forEach(function (player) {
      var element = document.getElementById("messaging-controls-" + player);
      var listener = new window.keypress.Listener(element);
      listener.simple_combo('enter', function () {
        $("#send-message-" + player).click();
      });
    });

    $('.messages-send-button').on('click', function (e) {
      var button = $(e.currentTarget);
      var from = button.attr('data-from');
      var to = button.attr('data-to');
      var message = $("#messages-to-send-" + to).val();
      $("#messages-to-send-" + to).val('');
      var obj = {
        event: 'message',
        from: from,
        to: to,
        message: message
      };
      if (!obj.message) return;
      abc.toSocket(obj);
    });

    // for removing the alert stars
    $('.messaging-tab').on('click', function (e) {
      var tab = $(e.currentTarget);
      tab.html(tab.attr('data-player').capitalize());
    });

    $('.messages-to-send').on('click', function (e) {
      var input = $(e.currentTarget);
      var player = input.attr('data-player');
      $("#tab-" + player).html(player.capitalize());
    });
  },

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

    htmlString += "\n    <img src='images/miscellaneous/ability-modifiers.png'>\n    <br><br>\n    <img src='images/miscellaneous/skill-table.jpg'>\n    <br><br>\n\n    <br> Level 2 - 2 Defense points, +1 Base damage\n    <br> Level 3 - Power point + 2 x To hit +1\n    <br> Level 4 - Base damage +2\n    <br> Level 5 - +3 Ability Score, Power point\n    <br> Level 6 - 2 Defense points, +1 Base damage\n    <br> Level 7 - Power point\n    <br> Level 8 - 2 Defense points\n    <br> Level 9 - 2 x To hit +1\n    <br> Level 10 - +1 Action point, 1 Power point, +3 Ability Score, Choose: Initiative +4, Speed +1, +3 Base damage    \n    ";

    return htmlString;
  },

  addTokenItem: function addTokenItem(imageFilename, top, left) {

    //I'm a bad person. Fix this
    var effects = ['poison.jpg', 'ice.jpg', 'fire.jpg', 'immobile.gif', 'prone.gif'];
    var id = "dynamically-added-div-" + abc.currentDynamicDivId;
    var htmlString = "";
    if (effects.indexOf(imageFilename) > -1) {
      htmlString = "<div id='" + id + "' class='token' style='position:absolute; top:" + top + "px; left:" + left + "px; width: 50px; height: 50px; opacity: 0.4;' token-id='" + abc.currentDynamicDivId + "'><img src='images/items/" + imageFilename + "' token-id='" + abc.currentDynamicDivId + "'></div>";
    } else {
      htmlString = "<div id='" + id + "' class='token' style='position:absolute; top:" + top + "px; left:" + left + "px; width: 50px; height: 50px;'><img src='images/items/" + imageFilename + "' token-id='" + abc.currentDynamicDivId + "'></div>";
    }
    $("#wrapper").append(htmlString);
    $("#" + id).draggable(abc.draggableOptionsToken);

    abc.activeTokens.push({
      divId: abc.currentDynamicDivId,
      imageFilename: imageFilename,
      creatingFunctionName: 'addTokenItem',
      top: top,
      left: left
    });

    abc.currentDynamicDivId++;
  },

  addTokenPlayerCharacter: function addTokenPlayerCharacter(imageFilename, top, left) {
    var id = "dynamically-added-div-" + abc.currentDynamicDivId;
    var htmlString = "<div id='" + id + "' class='token' style='position:absolute; top:" + top + "px; left:" + left + "px; width: 50px; height: 50px;' token-id='" + abc.currentDynamicDivId + "'><img src='images/player-characters/" + imageFilename + "' token-id='" + abc.currentDynamicDivId + "'></div>";
    $("#wrapper").append(htmlString);
    $("#" + id).draggable(abc.draggableOptionsToken);

    abc.activeTokens.push({
      divId: abc.currentDynamicDivId,
      imageFilename: imageFilename,
      creatingFunctionName: 'addTokenPlayerCharacter',
      top: top,
      left: left
    });

    abc.currentDynamicDivId++;
  },

  addTokenCreature: function addTokenCreature(imageFilename, top, left, creatureId) {
    var id = "dynamically-added-div-" + abc.currentDynamicDivId;
    var htmlString = "<div id='" + id + "' class='token' style='position:absolute; top:" + top + "px; left:" + left + "px; width: 50px; height: 50px;' token-id='" + abc.currentDynamicDivId + "'><img src='images/creatures/" + imageFilename + "' token-id='" + abc.currentDynamicDivId + "'></div>";
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

    abc.activeTokens.push({
      divId: abc.currentDynamicDivId,
      imageFilename: imageFilename,
      creatingFunctionName: 'addTokenCreature',
      top: top,
      left: left,
      creatureId: creatureId
    });

    abc.currentDynamicDivId++;
  },

  addCustomToken: function addCustomToken(imageFilename, top, left, height, width, opacity) {
    var id = "dynamically-added-div-" + abc.currentDynamicDivId;
    var htmlString = "<div id='" + id + "' class='token' style='position:absolute; top:" + top + "px; left:" + left + "px; width: " + width + "px; height: " + height + "px; opacity: " + opacity + ";' token-id='" + abc.currentDynamicDivId + "'><img src='images/custom/" + imageFilename + "' token-id='" + abc.currentDynamicDivId + "'></div>";
    $("#wrapper").append(htmlString);
    $("#" + id).draggable(abc.draggableOptionsToken);

    abc.activeTokens.push({
      divId: abc.currentDynamicDivId,
      imageFilename: imageFilename,
      creatingFunctionName: 'addCustomToken',
      top: top,
      left: left,
      height: height,
      width: width,
      opacity: opacity
    });

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
    // $('#wrapper').append(abc.createCreatureTableHtml())
    var options = {
      windowId: 'creature-table',
      content: abc.getCreatureTableWindowContent(),
      width: '550px',
      height: '300px',
      closeCallback: function creatureTableClosed() {
        abc.creatureTableCreated = false;
      }
    };
    abc.createWindow(options);
    abc.handlerCreatureTable();
    abc.creatureTableCreated = true;
  },

  // createCreatureTableHtml: () => {
  getCreatureTableWindowContent: function getCreatureTableWindowContent() {
    var htmlString = "";

    htmlString += "\n\n      <table id='creature-table' class='table-condensed'>\n        <tr id='ct-header-row'>\n          <th>Name</th>\n          <th>HP</th>\n          <th>AC</th>\n          <th>Will</th>\n          <th>Reflex</th>\n          <th>Status</th>\n          <th></th>\n        </tr>\n      </table>\n      ";

    return htmlString;
  },

  handlerCreatureTable: function handlerCreatureTable() {},

  addCreatureToCreatureTable: function addCreatureToCreatureTable(creature) {
    var htmlString = "";

    htmlString += "\n    <tr id='' creature-id='" + creature._id + "' token-id='" + creature.tokenId + "'>\n      <td id='creature-table-name-" + creature.tokenId + "' class='creature-table-name'>" + creature.name + "</td>\n      <td id=''><input class='form-control creature-table-hp-input' creature-id='" + creature._id + "' type='number' value='" + creature.hp + "'></td>\n      <td id=''><input class='form-control' creature-id='" + creature._id + "' type='number' value='" + creature.ac + "'></td>\n      <td id=''><input class='form-control' creature-id='" + creature._id + "' type='number' value='" + creature.will + "'></td>\n      <td id=''><input class='form-control' creature-id='" + creature._id + "' type='number' value='" + creature.reflex + "'></td>\n      <td id=''><input class='form-control creature-table-status'></td>\n      <td><button class='btn btn-sm ct-remove' token-id='" + creature.tokenId + "'><i class='glyphicon glyphicon-minus'></i></button></td>\n    </tr>";

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

  everyoneButMe: function everyoneButMe(obj) {
    abc.socket.emit('everyone-but-me', obj);
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

  // apiurl: "http://localhost:8082",
  apiurl: "http://192.241.203.33:8082",

  userIsPlayer: false,

  userIsDM: false,

  currentPlayerCharacterId: 0,

  currentPlayerName: '',

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

  messageWindowCreated: false,

  doNotInclude: ['npc', 'Ryland'],

  activeTokens: [],

  mouseX: 0,

  mouseY: 0

};
//# sourceMappingURL=js.js.map
