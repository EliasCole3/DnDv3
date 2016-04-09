

  getBottomDrawerHtml: () => {
    let htmlString = ``

    if(abc.userIsPlayer && !abc.userIsDM) {
      htmlString += ``
    }

    if(abc.userIsDM) {
      htmlString += `
        
        <button id='create-turn-counter' class='btn btn-md btn-info'>Create Turn Counter</button>
        <button id='create-creature-table' class='btn btn-md btn-info'>Create Creature Table</button>
      `
    }

    return htmlString
  },

  handlerBottomDrawerContents: () => {




    $("#create-turn-counter").on("click", e => {
      abc.socket.emit('core', {event: 'create-turn-counter'})
    })

    $("#create-creature-table").on("click", e => {
      abc.createCreatureTable()
    })
  
  },