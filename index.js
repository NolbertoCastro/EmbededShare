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
        if (block.type === 'paragraph' && block.paragraph && Array.isArray(block.paragraph.rich_text)) {
            for (const textItem of block.paragraph.rich_text) {
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

        updateInbox();
    });
});

async function updateInbox() {
    const blockId = pageId;

    async function createEmbedBlock(url) {
        
        const bookmarkBlock = {
            object: 'block',
            type: 'bookmark', 
            bookmark: {
              url: `${url}`
            }
          }

        await notion.blocks.children.append({
            block_id: blockId,
            children: [bookmarkBlock]
        });
        // Esperar un breve período antes de crear el siguiente bloque
        await new Promise(resolve => setTimeout(resolve, 500)); // Espera de 500 ms
    }

    // Crear cada bloque incrustado de forma secuencial
    for (const url of internetContent) {
        await createEmbedBlock(url);
    }

    // Repetir para otros arrays de contenido si es necesario
}