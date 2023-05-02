let filteredPayloadEvents = [
     {
        name:'member_removed',
        channel:'presence-online',
        user_id:8590,
    },
    {
        name: 'member_removed',
        channel: 'presence-man.8244',
        user_id: 8591,
    },
    {
        name:'member_added',
        channel:'presence-online',
        user_id:8590,
    },
    {
        name: 'member_added',
        channel: 'presence-man.8244',
        user_id: 8590,
    },
    {
        name: 'member_added',
        channel: 'presence-man.8244',
        user_id: 8590,
    },
]
const mirrorName = {
    member_added:'member_removed',
    member_removed: 'member_added',
}

filteredPayloadEvents = filteredPayloadEvents.reduce((acc, current) => {
    const indexMirrorEvent = acc.findIndex(item => (item && item.channel === current.channel && item.user_id === current.user_id && mirrorName[item.name] === current.name));
    if (indexMirrorEvent > -1) acc.splice(indexMirrorEvent,1);
    else acc.push(current)
    return acc;
}, []);

// remove duplicate Event for reload page
filteredPayloadEvents = filteredPayloadEvents.reduce((acc, current) => {
    const duplicateEvent = acc.find(item =>
        ( item && item.channel === current.channel && item.user_id === current.user_id && item.name === current.name));
    if (!duplicateEvent) acc.push(current);
    return acc;
}, []);

console.log(filteredPayloadEvents);
