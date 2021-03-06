$(() => {
  abc.initialize()
  // ebot.updateDocumentation(abc)
})

let abc = {
  
  initialize: () => {
    abc.assignInitialHandlers()
    ebot.insertModalHtml()
  },

  assignInitialHandlers: () => {
    abc.handlerNonPlayerCharacterCreateButton()
    abc.getNonPlayerCharacters().then(nonPlayerCharacters => {
      abc.nonPlayerCharacters = nonPlayerCharacters
      abc.createTable()
    })
  },

  createTable: () => {
    let htmlString = `<table id='non-player-character-table' class='table'>`

    htmlString += `
    <tr>
      <th>Non Player Character Id</th>
      <th>Player Name</th>
      <th>Character Name</th>
      <th>Race</th>
      <th>G Class</th>
      <th>Hp</th>
      <th>Ac</th>
      <th>Will</th>
      <th>Reflex</th>
      <th>Strength</th>
      <th>Constitution</th>
      <th>Dexterity</th>
      <th>Intelligence</th>
      <th>Wisdom</th>
      <th>Charisma</th>
      <th>Gold</th>
      <th>Xp</th>
      <th>Level</th>
      <th>Base to Hit Ac</th>
      <th>Base to Hit Will</th>
      <th>Base to Hit Reflex</th>
      <th>Damage Modifier</th>
      <th>Speed</th>
      <th>Initiative</th>
      <th>Action Points</th>
      <th>Image Filename</th>
      <th></th>
      <th></th>
    </tr>`

    abc.nonPlayerCharacters.forEach(nonPlayerCharacter => {
      htmlString += `<tr data-id='${nonPlayerCharacter._id}'>`
      htmlString += `<td>${nonPlayerCharacter.nonPlayerCharacterId}</td>`
      htmlString += `<td>${nonPlayerCharacter.playerName}</td>`
      htmlString += `<td>${nonPlayerCharacter.characterName}</td>`
      htmlString += `<td>${nonPlayerCharacter.race}</td>`
      htmlString += `<td>${nonPlayerCharacter.gClass}</td>`
      htmlString += `<td>${nonPlayerCharacter.hp}</td>`
      htmlString += `<td>${nonPlayerCharacter.ac}</td>`
      htmlString += `<td>${nonPlayerCharacter.will}</td>`
      htmlString += `<td>${nonPlayerCharacter.reflex}</td>`
      htmlString += `<td>${nonPlayerCharacter.strength}</td>`
      htmlString += `<td>${nonPlayerCharacter.constitution}</td>`
      htmlString += `<td>${nonPlayerCharacter.dexterity}</td>`
      htmlString += `<td>${nonPlayerCharacter.intelligence}</td>`
      htmlString += `<td>${nonPlayerCharacter.wisdom}</td>`
      htmlString += `<td>${nonPlayerCharacter.charisma}</td>`
      htmlString += `<td>${nonPlayerCharacter.gold}</td>`
      htmlString += `<td>${nonPlayerCharacter.xp}</td>`
      htmlString += `<td>${nonPlayerCharacter.level}</td>`
      htmlString += `<td>${nonPlayerCharacter.baseToHitAc}</td>`
      htmlString += `<td>${nonPlayerCharacter.baseToHitWill}</td>`
      htmlString += `<td>${nonPlayerCharacter.baseToHitReflex}</td>`
      htmlString += `<td>${nonPlayerCharacter.damageModifier}</td>`
      htmlString += `<td>${nonPlayerCharacter.speed}</td>`
      htmlString += `<td>${nonPlayerCharacter.initiative}</td>`
      htmlString += `<td>${nonPlayerCharacter.actionPoints}</td>`
      htmlString += `<td>${nonPlayerCharacter.imageFilename}</td>`
      htmlString += `<td><button class='btn btn-sm update-non-player-character' data-id='${nonPlayerCharacter._id}'>Update</button></td>`
      htmlString += `<td><button class='btn btn-sm delete-non-player-character' data-id='${nonPlayerCharacter._id}'>Delete</button></td>`
      htmlString += `</tr>`
    })


    htmlString += `</table>`
    $("#non-player-character-table-wrapper").html(htmlString)
    abc.handlerNonPlayerCharacterTable()
  },

  handlerNonPlayerCharacterTable: () => {
    $(".update-non-player-character").click(e => {
      let button = $(e.currentTarget)
      let id = button.attr("data-id")
      ebot.showModal(`Update Non Player Character`, abc.getNonPlayerCharacterForm())
      abc.fillNonPlayerCharacterFormWithOldData(id)
      abc.handlerUpdate(id)
    })

    $(".delete-non-player-character").click(e => {
      let button = $(e.currentTarget)
      let id = button.attr("data-id")
      ebot.showModal(`Are you sure?`, `<button id='submit-deletion' class='btn btn-lg form-control' data-id='${id}' type='submit'>Yes</button>`)
      abc.handlerDelete()
    })
  },

  handlerNonPlayerCharacterCreateButton: () => {
    $("#non-player-character-create-button").click(e => {
      ebot.showModal("New Non Player Character", abc.getNonPlayerCharacterForm())
      abc.handlerCreate()
    })
  },

  handlerCreate: () => {
    $("#submit").click(e => {
      let jsonData = JSON.stringify({
        "nonPlayerCharacterId": $("#non-player-character-id").val(),
        "playerName": $("#player-name").val(),
        "characterName": $("#character-name").val(),
        "race": $("#race").val(),
        "gClass": $("#g-class").val(),
        "hp": $("#hp").val(),
        "ac": $("#ac").val(),
        "will": $("#will").val(),
        "reflex": $("#reflex").val(),
        "strength": $("#strength").val(),
        "constitution": $("#constitution").val(),
        "dexterity": $("#dexterity").val(),
        "intelligence": $("#intelligence").val(),
        "wisdom": $("#wisdom").val(),
        "charisma": $("#charisma").val(),
        "gold": $("#gold").val(),
        "xp": $("#xp").val(),
        "level": $("#level").val(),
        "baseToHitAc": $("#base-to-hit-ac").val(),
        "baseToHitWill": $("#base-to-hit-will").val(),
        "baseToHitReflex": $("#base-to-hit-reflex").val(),
        "damageModifier": $("#damage-modifier").val(),
        "speed": $("#speed").val(),
        "initiative": $("#initiative").val(),
        "actionPoints": $("#action-points").val(),
        "imageFilename": $("#image-filename").val()
      })

      abc.createNonPlayerCharacter(jsonData).then(data => {
        abc.getNonPlayerCharacters().then(nonPlayerCharacters => {
          abc.nonPlayerCharacters = nonPlayerCharacters
          abc.createTable()
          ebot.hideModal()
        })
      })
    })
  },

  handlerUpdate: id => {
    $("#submit").click(e => {
      let jsonData = JSON.stringify({
        "nonPlayerCharacterId": $("#non-player-character-id").val(),
        "playerName": $("#player-name").val(),
        "characterName": $("#character-name").val(),
        "race": $("#race").val(),
        "gClass": $("#g-class").val(),
        "hp": $("#hp").val(),
        "ac": $("#ac").val(),
        "will": $("#will").val(),
        "reflex": $("#reflex").val(),
        "strength": $("#strength").val(),
        "constitution": $("#constitution").val(),
        "dexterity": $("#dexterity").val(),
        "intelligence": $("#intelligence").val(),
        "wisdom": $("#wisdom").val(),
        "charisma": $("#charisma").val(),
        "gold": $("#gold").val(),
        "xp": $("#xp").val(),
        "level": $("#level").val(),
        "baseToHitAc": $("#base-to-hit-ac").val(),
        "baseToHitWill": $("#base-to-hit-will").val(),
        "baseToHitReflex": $("#base-to-hit-reflex").val(),
        "damageModifier": $("#damage-modifier").val(),
        "speed": $("#speed").val(),
        "initiative": $("#initiative").val(),
        "actionPoints": $("#action-points").val(),
        "imageFilename": $("#image-filename").val()
      })

      abc.updateNonPlayerCharacter(id, jsonData).then(data => {
        abc.getNonPlayerCharacters().then(nonPlayerCharacters => {
          abc.nonPlayerCharacters = nonPlayerCharacters
          abc.createTable()
          ebot.hideModal()
        })
      })
    })
  },

  handlerDelete: () => {
    $("#submit-deletion").click(e => {
      let button = $(e.currentTarget)
      let id = button.attr("data-id")
      abc.deleteNonPlayerCharacter(id).then(() => {
        ebot.hideModal()
        $(`tr[data-id=${id}]`).remove()
      })
    })
  },

  getNonPlayerCharacterForm: () => {
    let htmlString = `
    <label>Non Player Character Id</label> <input id='non-player-character-id' type='number' class='form-control'><br />
    <label>Player Name</label> <input id='player-name' class='form-control'><br />
    <label>Character Name</label> <input id='character-name' class='form-control'><br />
    <label>Race</label> <input id='race' class='form-control'><br />
    <label>G Class</label> <input id='g-class' class='form-control'><br />
    <label>Hp</label> <input id='hp' type='number' class='form-control'><br />
    <label>Ac</label> <input id='ac' type='number' class='form-control'><br />
    <label>Will</label> <input id='will' type='number' class='form-control'><br />
    <label>Reflex</label> <input id='reflex' type='number' class='form-control'><br />
    <label>Strength</label> <input id='strength' type='number' class='form-control'><br />
    <label>Constitution</label> <input id='constitution' type='number' class='form-control'><br />
    <label>Dexterity</label> <input id='dexterity' type='number' class='form-control'><br />
    <label>Intelligence</label> <input id='intelligence' type='number' class='form-control'><br />
    <label>Wisdom</label> <input id='wisdom' type='number' class='form-control'><br />
    <label>Charisma</label> <input id='charisma' type='number' class='form-control'><br />
    <label>Gold</label> <input id='gold' type='number' class='form-control'><br />
    <label>Xp</label> <input id='xp' type='number' class='form-control'><br />
    <label>Level</label> <input id='level' type='number' class='form-control'><br />
    <label>Base to Hit Ac</label> <input id='base-to-hit-ac' type='number' class='form-control'><br />
    <label>Base to Hit Will</label> <input id='base-to-hit-will' type='number' class='form-control'><br />
    <label>Base to Hit Reflex</label> <input id='base-to-hit-reflex' type='number' class='form-control'><br />
    <label>Damage Modifier</label> <input id='damage-modifier' type='number' class='form-control'><br />
    <label>Speed</label> <input id='speed' type='number' class='form-control'><br />
    <label>Initiative</label> <input id='initiative' type='number' class='form-control'><br />
    <label>Action Points</label> <input id='action-points' type='number' class='form-control'><br />
    <label>Image Filename</label> <input id='image-filename' class='form-control'><br />
    <button id='submit' class='form-control' type='submit'>Submit</button>`
    return htmlString
  },

  fillNonPlayerCharacterFormWithOldData: id => {
    abc.getNonPlayerCharacter(id).then(data => {
      $("#non-player-character-id").val(data.nonPlayerCharacterId),
      $("#player-name").val(data.playerName),
      $("#character-name").val(data.characterName),
      $("#race").val(data.race),
      $("#g-class").val(data.gClass),
      $("#hp").val(data.hp),
      $("#ac").val(data.ac),
      $("#will").val(data.will),
      $("#reflex").val(data.reflex),
      $("#strength").val(data.strength),
      $("#constitution").val(data.constitution),
      $("#dexterity").val(data.dexterity),
      $("#intelligence").val(data.intelligence),
      $("#wisdom").val(data.wisdom),
      $("#charisma").val(data.charisma),
      $("#gold").val(data.gold),
      $("#xp").val(data.xp),
      $("#level").val(data.level),
      $("#base-to-hit-ac").val(data.baseToHitAc),
      $("#base-to-hit-will").val(data.baseToHitWill),
      $("#base-to-hit-reflex").val(data.baseToHitReflex),
      $("#damage-modifier").val(data.damageModifier),
      $("#speed").val(data.speed),
      $("#initiative").val(data.initiative),
      $("#action-points").val(data.actionPoints),
      $("#image-filename").val(data.imageFilename)
    })
  },

  getNonPlayerCharacters: () => {
    let deferred = $.ajax({
      type: "GET",
      url: `${abc.apiurl}/nonPlayerCharacters`,
      success: function(data, status, jqXHR) {},
      error: function(jqXHR, status) {console.log("getNonPlayerCharacters() Error")}
    }).promise()

    return deferred
  },

  createNonPlayerCharacter: jsonData => {
    console.log(jsonData)
    let deferred = $.ajax({
      type: "POST",
      url: `${abc.apiurl}/nonPlayerCharacters`,
      data: abc.convertJsonToFormData(jsonData),
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      success: (data, status, jqXHR) => {},
      error: (jqXHR, status) => {
        ebot.notify("error creating a Non Player Character")
        console.log(jqXHR)
      }
    }).promise()

    return deferred
  },

  getNonPlayerCharacter: id => {
    let deferred = $.ajax({
      type: "GET",
      url: `${abc.apiurl}/nonPlayerCharacters/${id}`,
      success: function(data, status, jqXHR) {},
      error: function(jqXHR, status) {console.log("getNonPlayerCharacter() Error")}
    }).promise()

    return deferred
  },

  updateNonPlayerCharacter: (id, jsonData) => {
    let deferred = $.ajax({
      type: "PUT",
      url: `${abc.apiurl}/nonPlayerCharacters/${id}`,
      data: abc.convertJsonToFormData(jsonData),
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      success: (data, status, jqXHR) => {},
      error: (jqXHR, status) => {
        ebot.notify("error updating a Non Player Character")
        console.log(jqXHR)
      }
    }).promise()

    return deferred
  },

  deleteNonPlayerCharacter: id => {
    let deferred = $.ajax({
      type: "DELETE",
      url: `${abc.apiurl}/nonPlayerCharacters/${id}`,
      success: function(data, status, jqXHR) {},
      error: function(jqXHR, status) {console.log("deleteNonPlayerCharacter() Error")}
    }).promise()

    return deferred
  },

  convertJsonToFormData: json => {
    let string = ``

    json = JSON.parse(json)

    for(let prop in json) {
      let converted = `${prop}=${encodeURI(json[prop])}&`
      converted = converted.replace(/%20/g, "+")
      string += converted
    }
    string = string.replace(/&$/g, "")

    return string
  },

 // apiurl: "http://localhost:8082",
  apiurl: "http://192.241.203.33:8082",

  nonPlayerCharacters: []

}