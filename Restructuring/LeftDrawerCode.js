fillLeftDrawer: () => {
    if(abc.userIsPlayer) {
      $(`#left-drawer-contents`).html(abc.getLeftDrawerHtml())
      abc.handlerLeftDrawerContents()
    } else {
      $(`#left-drawer-contents`).html("Unauthorized user detected!")
    }
  },

  getLeftDrawerHtml: () => {
    let htmlString = `
    <button id='toggle-lines' class='btn btn-md btn-info'>Toggle Lines</button> 
    <br><br>
    <button id='show-all-powers' class='btn btn-md btn-info'>Show All Powers</button>
    <br><br>
    <button id='show-all-powers-improved' class='btn btn-md btn-info'>Show All Powers+</button>
    <br><br>
    <button id='helpful-info' class='btn btn-md btn-info'>Helpful Info</button>
    
    `

    if(abc.userIsPlayer && !abc.userIsDM) {
      htmlString += `
      <br><br><button id='show-backstory' class='btn btn-md btn-info'>Show My Backstory</button>
      <br><br><button id='show-my-powers' class='btn btn-md btn-info'>Show My Powers</button>
      `
    }

    if(abc.userIsDM) {
      htmlString += `<br><br>
      <select id='background-select' data-placeholder='Choose a background...'>
        <option value=''></option>
        <option value='blank'>Blank</option>
        <option value='zone-map.png'>Zone Map</option>
        <option value='river.jpg'>River</option>
        <option value='twooth-library.png'>Twooth Library</option>
        <option value='slime-cave.png'>Slime Cave</option>
        <option value='andora-tavern.jpg'>Andora Tavern</option>
        <option value='andora-gates.png'>Andora Gates</option>
        <option value='andora.jpg'>Andora</option>
        <option value='brement.jpg'>Brement</option>
        <option value='dark-forest-1.jpg'>Dark Forest</option>
        <option value='desert-1.JPG'>Desert 1</option>
        <option value='desert-statue.jpg'>Desert Statue</option>
        <option value='dunkar.jpg'>Dunkar</option>
        <option value='forest-path-1.jpg'>Forest Path 1</option>
        <option value='forest-path-2.jpg'>Forest Path 2</option>
        <option value='forest-1.JPG'>Forest 1</option>
        <option value='plains-1.jpg'>Plains 1</option>
        <option value='plains-2.jpg'>Plains 2</option>
        <option value='spider-den.jpg'>Spider Den</option>
        <option value='twooth.jpg'>Twooth</option>
        <option value='ameretis-flashback-1.jpg'>Flashback 1</option>
      </select>
      `
    }

    return htmlString
  },

  handlerLeftDrawerContents: () => {
    $("#toggle-lines").click(e => {
      if($("#lines").css("opacity") === "0.3") {
        $("#lines").velocity({opacity: "0"})
      } else {
        $("#lines").velocity({opacity: "0.3"})
      }
    })

    $("#show-all-powers").click(e => {
      ebot.showModal("All Powers", abc.viewAllPowers())
    })

    $("#show-all-powers-improved").click(e => {
      ebot.showModal("All Powers+", abc.viewAllPowersImproved())
      abc.handlerAllPowersImproved()
    })

    $("#helpful-info").click(e => {
      ebot.showModal("Helpful Info", abc.viewHelpfulInfo())
    })

    $("#background-select").chosen(ebot.chosenOptions).change(e => {
      let element = $(e.currentTarget)
      abc.changeBackground(element.val())
      abc.socket.emit('background changed', {background: element.val()})
    })

    $('#background_select_chosen').css('width', '100%')

    $("#show-backstory").click(e => {
      let detailText = abc.characterDetails.filter(detail => {
        return detail.playerCharacterId == abc.currentPlayerCharacterId
      })[0].backstory
      
      // detailText = `<pre>${detailText}</pre>`

      detailText = `<div style="white-space: pre-wrap;">${detailText}</div>`

      ebot.showModal("Backstory", detailText)
    })

    $("#show-my-powers").click(e => {
      let htmlString = ``

      let relevantPowerJoins = abc.joinPlayerCharacterPowers.filter(join => {
        return join.playerCharacterId == abc.currentPlayerCharacterId
      })

      relevantPowerJoins.forEach(join => {
        let relevantPower = abc.powers.filter(power => {
          return power.powerId == join.powerId
        })[0]

        htmlString += `
        <div class='power-view'>

          <h4>${relevantPower.name}</h4>
          Type: ${relevantPower.type} <br>
          Attack Type: ${relevantPower.attackType} <br>
          Damage: ${relevantPower.damage} <br>
          Effect: ${relevantPower.effect} <br>
          Description: ${relevantPower.description} <br>
          Flavor: ${relevantPower.flavorText} <br>
          Upgrade Effects: ${relevantPower.upgrade} <br>

        </div><br><br>`
      })

      ebot.showModal("My Powers", htmlString)
    })
  },
