const chatGPTKey = "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"


async function askChatGPT(question, sourceText, format) {
    const message = `
        ${question}
        Give the answer as a ${format}. If the information cannot be found, answer "null".
        Answer that question using the information from the following text:
        ${sourceText}
    `

    console.log("Query: ", message)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${chatGPTKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",//"gpt-4o",
            messages: [
                {
                    role: "user",
                    content: message
                }
            ]
        })
    })

    const json = await response.json()

    // console.log(json)

    return json.choices[0]
}


module.exports = {
    askChatGPT
}