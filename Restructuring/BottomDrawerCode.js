 fillBottomDrawer: () => {
    if(abc.userIsPlayer) {
      $(`#bottom-drawer-contents`).html(abc.getBottomDrawerHtml())
      abc.handlerBottomDrawerContents()
    } else {
      $(`#bottom-drawer-contents`).html("Unauthorized user detected!")
    }
  },

  getBottomDrawerHtml: () => {
    let htmlString = ``

    if(abc.userIsPlayer && !abc.userIsDM) {
      htmlString += ``
    }

    if(abc.userIsDM) {
      htmlString += `
        <button id='toggle-cursor-visibility' class='btn btn-md btn-info'>toggle cursors</button>
        <button id='reload-top-drawer' class='btn btn-md btn-info'>reload top drawer</button>
        <button id='create-turn-counter' class='btn btn-md btn-info'>Create Turn Counter</button>
        <button id='create-creature-table' class='btn btn-md btn-info'>Create Creature Table</button>
      `
    }

    return htmlString
  },

  handlerBottomDrawerContents: () => {
    $("#toggle-cursor-visibility").on("click", e => {
      abc.cursorsVisible = !abc.cursorsVisible
      abc.socket.emit('cursors toggle visibility', {cursorsVisible: abc.cursorsVisible})
    })

    $("#reload-top-drawer").on("click", e => {
      abc.socket.emit('reload top drawer')
    })

    $("#create-turn-counter").on("click", e => {
      abc.socket.emit('core', {event: 'create-turn-counter'})
    })

    $("#create-creature-table").on("click", e => {
      abc.createCreatureTable()
    })
  
  },