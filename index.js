/* global module */
/* eslint no-undef: "error" */
const ROLE_USER = 'user';
const ROLE_AGENT = 'agent';

// Plugin method that runs on plugin load
async function setupPlugin({ config }) {
    console.log(config.dialog_size)
}

async function makePostRequest(url, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Accept": "*/*",
           
        },
        body: JSON.stringify(data)
      });
  
      if (response.status === 200) {
        const responseData = await response.json();
        return responseData;
      } else {
        console.error("Request message " + response);
      }
    } catch (error) {
      console.error("Error:", error);
    }
}

async function splitDialogText(dialog_text) {
    
    const userPattern = /user:(.*?)(?=(agent:|$))/gs;
    const agentPattern = /(agent|system):(.*?)(?=(user:|$))/gs;
    
    const userMatches = dialog_text.matchAll(userPattern);
    const agentMatches = dialog_text.matchAll(agentPattern);

    const userUtterances = [...userMatches].map(match => match[1]);
    const agentUtterances = [...agentMatches].map(match => match[1]);
    
    return { user: userUtterances, agent: agentUtterances };

}

async function processEvent(event, { config, cache }) {

    host_url = config.HOST_URL;

    const hostUrl = config.HOST_URL;;
    const path = '/conversation_toxicity';

    const fullUrl = hostUrl + path;
    if (!event.properties) {
        event.properties = {};
    }

    if (!event.properties['text']) {
        return event
    }

    dialog = event.properties['text']
    const utterances = await splitDialogText(dialog);

    // Get conversation toxicity
    const textRoles = [];
    for (const userUtterance of utterances.user) {
        let cleanedUserUtterance = userUtterance.replace(/^user:/, '');
        textRoles.push({ text: cleanedUserUtterance, role: ROLE_USER });
    }

    for (const agentUtterance of utterances.agent) {
        let cleanedAgentUtterance = agentUtterance.replace(/^(agent|system):/, '');
        textRoles.push({ text: cleanedAgentUtterance, role: ROLE_AGENT });
    }

    console.log("textRoles", textRoles)
    res = await makePostRequest(fullUrl, textRoles);
    
    // Iterate res dictionary and add to event
    for (const key in res) {
      if (res.hasOwnProperty(key) && res[key] > 0) {
            event.properties[key] = res[key]; 
        }
    }

    return event;
}

// The plugin itself
module.exports = {
    setupPlugin,
    processEvent
}
