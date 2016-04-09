// DM token stuff

  abc.items.forEach(item => {
      htmlString += `<button class='add-item-button' item-id='${item._id}' item-image-filename='${item.imageFilename}'><img src='images/items/${item.imageFilename}'></button>`
    })

    htmlString += `<br><br><br>`

    abc.playerCharacters.forEach(pc => {
      htmlString += `<button class='add-player-character-button' player-character-id='${pc._id}' player-character-image-filename='${pc.imageFilename}'><img src='/images/player-characters/${pc.imageFilename}'></button>`
    })

    htmlString += `<br><br><br>`

    abc.creatures.forEach(creature => {
      htmlString += `<button class='add-creature-button' creature-id='${creature._id}' creature-image-filename='${creature.imageFilename}'><img src='/images/creatures/${creature.imageFilename}'></button>`
    })

    htmlString += `<br><br><br>`

    // add-custom-token
    htmlString += `
      <button class='add-custom-token' image-filename='test.png' token-height='100' token-width='100' opacity='.3'><img height='50' width='50' src='/images/custom/test.png'></button> <br>
      blizzard: <button class='add-custom-token' image-filename='blizzard.png' token-height='150' token-width='150' opacity='.5'><img height='50' width='50' src='/images/custom/blizzard.png'></button> <br>
      caution: <button class='add-custom-token' image-filename='caution.png' token-height='100' token-width='100' opacity='.5'><img height='50' width='50' src='/images/custom/caution.png'></button> <br>
      sorrow: <button class='add-custom-token' image-filename='sorrow.png' token-height='150' token-width='150' opacity='.5'><img height='50' width='50' src='/images/custom/sorrow.png'></button> <br>
      heals: <button class='add-custom-token' image-filename='green3.png' token-height='150' token-width='150' opacity='.5'><img height='50' width='50' src='/images/custom/green3.png'></button>
    `




// handlers for tokens
$(".add-item-button").click(e => {
  let button = $(e.currentTarget)
  let imageFilename = button.attr("item-image-filename")
  let ranTop = ebot.getRandomInt(2, 10) * 50
  let ranLeft = ebot.getRandomInt(2, 10) * 50
  abc.addTokenItem(imageFilename, ranTop, ranLeft)

  let emitObj = {
    imageFilename: imageFilename,
    ranTop: ranTop,
    ranLeft: ranLeft
  }

  abc.socket.emit('item token added', emitObj)
})

$(".add-player-character-button").click(e => {
  let button = $(e.currentTarget)
  let imageFilename = button.attr("player-character-image-filename")
  let ranTop = ebot.getRandomInt(2, 10) * 50
  let ranLeft = ebot.getRandomInt(2, 10) * 50
  abc.addTokenPlayerCharacter(imageFilename, ranTop, ranLeft)

  let emitObj = {
    imageFilename: imageFilename,
    ranTop: ranTop,
    ranLeft: ranLeft
  }

  abc.socket.emit('player character token added', emitObj)
})

$(".add-creature-button").click(e => {
  let button = $(e.currentTarget)
  let imageFilename = button.attr("creature-image-filename")
  let id = button.attr("creature-id")
  let ranTop = ebot.getRandomInt(2, 10) * 50
  let ranLeft = ebot.getRandomInt(2, 10) * 50
  abc.addTokenCreature(imageFilename, ranTop, ranLeft, id)

  let emitObj = {
    imageFilename: imageFilename,
    ranTop: ranTop,
    ranLeft: ranLeft,
    id: id
  }

  abc.socket.emit('creature token added', emitObj)
})

$(".add-custom-token").click(e => {
  let button = $(e.currentTarget)
  let imageFilename = button.attr("image-filename")
  let ranTop = ebot.getRandomInt(2, 10) * 50
  let ranLeft = ebot.getRandomInt(2, 10) * 50
  let height = button.attr("token-height")
  let width = button.attr("token-width")
  let opacity = button.attr("opacity")
  // abc.addCustomToken(imageFilename, ranTop, ranLeft, height, width)

  let emitObj = {
    event: 'add-custom-token',
    imageFilename: imageFilename,
    ranTop: ranTop,
    ranLeft: ranLeft,
    height: height,
    width: width,
    opacity: opacity
  }

  abc.toSocket(emitObj)
})







    // Player item stuff

    let relevantItemJoins = abc.joinPlayerCharacterItems.filter(join => {
      return join.playerCharacterId == abc.currentPlayerCharacterId
    })

    relevantItemJoins.forEach(join => {
      let relevantItem = abc.items.filter(item => {
        return item.itemId == join.itemId
      })[0]

      htmlString += `<img src='images/items/${relevantItem.imageFilename}' class='player-item'> x ${join.count}<br>`
    })

    let currentPlayerCharacter = abc.playerCharacters.filter(pc => {
      return pc.playerCharacterId == abc.currentPlayerCharacterId
    })[0]

    let items = currentPlayerCharacter.items.split(', ')
    items.forEach(item => {
      htmlString += `<br>${item}`
    })