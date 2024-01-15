require('dotenv').config()

const {Client} = require('@notionhq/client')

const notion = new Client({auth: process.env.NOTION_KEY})

const pageId = process.env.NOTION_PAGE_ID;  
const youtubeVideos = []
const instagramContent = []
const twitterContent = []
const internetContent = []
const photos = []
const audios = []

async function getPagePages() {
    try {
        const blockResponse = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 200 
        });

        return blockResponse.results;
    } catch (error) {
        console.error(error);
    }
}

async function getInPageContent(pageId){
    const blocks = (await notion.blocks.children.list({ block_id: pageId, page_size: 100 })).results;

    for (const block of blocks) {
        // Check if block is a paragraph and has rich text content
        if (block.type === 'paragraph' && block.paragraph && Array.isArray(block.paragraph.rich_text)) {
            for (const textItem of block.paragraph.rich_text) {
                // Check if the rich text item is of type 'text' and contains an Instagram link
                if (textItem.type === 'text' && textItem.text.content.includes('https://www.instagram.com')) {
                    const urlMatch = textItem.text.content.match(/https:\/\/www\.instagram\.com\/[^\s]+/);
                    if (urlMatch && urlMatch.length > 0) {
                        instagramContent.push(urlMatch[0])
                    }
                } else if (textItem.type === 'text' && textItem.text.content.includes('https://www.youtube.com')){
                    const urlMatch = textItem.text.content.match(/https:\/\/www\.youtube\.com\/[^\s]+/);
                    if (urlMatch && urlMatch.length > 0) {
                        youtubeVideos.push(urlMatch[0])
                    }
                } else if (textItem.type === 'text' && textItem.text.content.includes('https://twitter.com')){
                    const urlMatch = textItem.text.content.match(/https:\/\/twitter\.com\/[^\s]+/);
                    if (urlMatch && urlMatch.length > 0) {
                        twitterContent.push(urlMatch[0])
                    }
                } else if (textItem.type === 'text' && textItem.text.content.includes('https://x.com')){
                    const urlMatch = textItem.text.content.match(/https:\/\/x\.com\/[^\s]+/);
                    if (urlMatch && urlMatch.length > 0) {
                        twitterContent.push(urlMatch[0])
                    }
                } else {
                    const urlMatch = textItem.text.content.match(/https:\/\/[^\s]+/);
                    if (urlMatch && urlMatch.length > 0) {
                        internetContent.push(urlMatch[0])
                    }
                }
            }
        } else if (block.type === 'image') {
            // Extract the image URL
            let imageUrl = block.image.file ? block.image.file.url : null;

            if (imageUrl) {
                photos.push(imageUrl);
            }
        }
    }
}


async function getContent(pages) {
    for (let page of pages) {
        if (page.type === 'child_page') {
            const pageTitle = page.child_page.title;

            if (pageTitle.includes("https://youtube.com")) {
                youtubeVideos.push(pageTitle);
            } else {
                await getInPageContent(page.id)
            }
        }
    }
}

getPagePages().then(blocks => {
    getContent(blocks).then(() => {
        console.log('Videos de YouTube:', youtubeVideos);
        console.log('Contenido de Instagram:', instagramContent);
        console.log('Contenido de Twitter:', twitterContent);
        console.log('Contenido de Internet:', internetContent);
        console.log('Imagenes:', photos);
    });

    updateInbox()
});

async function updateInbox() {

    const blockId = pageId;
    const response = await notion.blocks.children.append({
        block_id: blockId,
        children: [
        {
            "heading_2": {
            "rich_text": [
                {
                "text": {
                    "content": "Youtube Content"
                }
                }
            ]
            }
        },
        {
            "paragraph": {
            "rich_text": [
                {
                "text": {
                    "content": "Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.",
                    "link": {
                    "url": "https://en.wikipedia.org/wiki/Lacinato_kale"
                    }
                }
                }
            ]
            }
        }
        ],
    });
    console.log(response);
}