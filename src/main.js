import m from 'mithril'

var id = 0

function generateId() { return id++ }

// Object.prototype.genid = function() {
//     var newId = generateId()
//     // this.id = function() { return newId }
//     this.id = newId
//     return newId
// }

var template = {
    title: 'Loading...',
    description: null,
    items: null
}

var items = null

if(location.search != '') {
    var template = location.search.substring(1)
    m.request({
        method: 'GET',
        url: '/templates/' + template + '.json',
    }).then(function(result) {
        items = []
        for(var item of result.items) {
            if(Array.isArray(item)) {
                var subitems = []
                for(var s of item) {
                    var val = new String(s)
                    val.id = generateId()
                    val.value = false
                    subitems.push(val)
                }
                items.push(subitems)
            } else {
                subitems = {}
                for(const [key, children] of Object.entries(item)) {
                    var subsub = []
                    for(var s of children) {
                        var val = new String(s)
                        val.id = generateId()
                        val.value = false
                        subsub.push(val)
                    }
                    subitems[key] = subsub
                }
                items.push(subitems)
            }
        }
        template = result
    })
} else {
    template.description = 'template name is not specified.'
}

function makeMattermostPayload() {
    var result = ""
    for(var item of items) {
        if(Array.isArray(item)) {
            for(var s of item) {
                result += '- ['
                result += s.value? 'x' : ' '
                result += '] ' + s.toString() + '\n'
            }
        } else {
            for(const [key, children] of Object.entries(item)) {
                result += key + '\n'
                for(var s of children) {
                    result += '- ['
                    result += s.value? 'x' : ' '
                    result += '] ' + s.toString() + '\n'
                }
            }
        }
    }
    return {
        text: result
    }
}

function doneButtonClicked() {
    if(confirm('Are you sure ?')) {
        var payload = null
        if(template.type == 'mattermost') {
            payload = makeMattermostPayload()
        }
        console.log(payload)
        m.request({
            method: 'POST',
            url: template.url,
            body: payload
        }).then(function() {
            alert('done')
        })
    }
}

var Title = {
    view: function() {
        return <h1 class="title is-3">{template.title}</h1>
    }
}

var CheckList = {
    descript: function() {
        return <article class="message is-warning">
            <div class="message-header"><p>Caution</p></div>
            <div class="message-body">{m.trust(template.description)}</div>
        </article>
    },
    checkbox: function(item) {
        function checked() {
            item.value = this.checked
        }
        return <div class="field">
            <div class="control">
                <label class='checkbox'>
                    <input class="mr-2" type='checkbox' data-item={item.id} checked={item.value} onchange={checked} />
                    {item.toString()}
                </label>
            </div>
        </div>
    },
    view: function() {
        return [
            template.description && CheckList.descript (),
            items && <form onsubmit='return false'>
                {items.map(function(item) {
                    if(Array.isArray(item)) {
                        return item.map(function(subitem) {
                            return CheckList.checkbox(subitem)
                        })
                    }
                    for(const [key, children] of Object.entries(item)) {
                        return [
                            <h3 class="title is-5 mb-2">{key}</h3>,
                            <ul class="pl-4 mb-4">
                                {children.map(function(subitem) {
                                    return <li>
                                        {CheckList.checkbox(subitem)}
                                    </li>
                                })}
                            </ul>
                        ]
                    }
                })}
                <div class="field">
                    <div class="control" style="text-align: center">
                        <button type="button" class="button is-link" onclick={doneButtonClicked}>Done</button>
                    </div>
                </div>
            </form>
        ]
    }
}

m.mount(document.getElementById('title'), Title)
m.mount(document.getElementById('check-list'), CheckList)
