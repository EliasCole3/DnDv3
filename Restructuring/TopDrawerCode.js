

  getTopDrawerHtml: () => {
    let htmlString = ``



    return htmlString
  },

  getTopDrawerHtmlDM: () => {
    let htmlString = `<table id='player-stats-table' class="table-condensed">`

    htmlString += `<tr>
      <th>Player Name</th>
      <th>Character Name</th>
      <th>Current HP</th>
      <th>Max HP</th>
      <th>AC</th>
      <th>Will</th>
      <th>Reflex</th>
      <th>To Hit AC/Will/Reflex</th>
      <th>Damage Mod</th>
      <th>Speed</th>
      <th>Initiative</th>
      <th>Action Points</th>
      <th>Gold</th>
      <th>Str</th>
      <th>Con</th>
      <th>Int</th>
      <th>Wis</th>
      <th>Dex</th>
      <th>Cha</th>
    </tr>`

    abc.playerCharacters.forEach(player => {
      

      if(abc.doNotInclude.indexOf(player.playerName) === -1) {
          htmlString += `<tr player-character-id=${player.playerCharacterId}>
          <td>${player.playerName}</td>
          <td>${player.characterName}</td>
          <td><input id='current-hp-input-${player.playerCharacterId}' class='current-hp-input form-control' type='number' value='${player.hp}'></td>
          <td>${player.hp}</td>
          <td>${player.ac}</td>
          <td>${player.will}</td>
          <td>${player.reflex}</td>
          <td style="text-align:center;">${player.baseToHitAc}/${player.baseToHitWill}/${player.baseToHitReflex}</td>
          <td>${player.damageModifier}</td>
          <td>${player.speed}</td>
          <td>${player.initiative}</td>
          <td>${player.actionPoints}</td>
          <td>${player.gold}</td>
          <td>${player.strength}</td>
          <td>${player.constitution}</td>
          <td>${player.intelligence}</td>
          <td>${player.wisdom}</td>
          <td>${player.dexterity}</td>
          <td>${player.charisma}</td>

        </tr>`
      }
      
    })

    htmlString += `</table>`

    return htmlString
  },

  handlerTopDrawerContents: () => {
    $(".current-hp-input").off("change")

    $(".current-hp-input").on("change", e => {
      let element = $(e.currentTarget)
      let id = element.attr("id")
      let val = element.val()
      abc.socket.emit('hp changed', {id: id, val: val})
    })
  },
