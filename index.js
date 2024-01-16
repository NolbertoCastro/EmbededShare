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

function formatYouTubeUrl(url) {
    if (!url.startsWith('https://www.youtube.com/')) {
        return url.replace('https://youtube.com/', 'https://www.youtube.com/');
    }
    return url;
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

            // Previous Solution using urls
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
        updateInbox();
    });
});

async function updateInbox() {
    const blockId = pageId;
    const children = [];

    function bookmarkedContent(title, contentArray) {
        const totalElements = contentArray.length;
        const columns = 3; 
        const elementsPerColumn = Math.ceil(totalElements / columns);

        children.push({
            object: 'block',
            type: 'heading_2',
            heading_2: { rich_text: [{ text: { content: title } }] }
        });

        const columnListBlock = {
            object: 'block',
            type: 'column_list',
            column_list: {
                children: []
            }
        };

        for (let i = 0; i < columns; i++) {
            const column = {
                object: 'block',
                type: 'column',
                column: {
                    children: []
                }
            };

            for (let j = 0; j < elementsPerColumn; j++) {
                const index = i * elementsPerColumn + j;
                if (index < totalElements) {
                    const bookmarkBlock = {
                        object: 'block',
                        type: 'bookmark', 
                        bookmark: {
                            url: contentArray[index]
                        }
                    };
                    column.column.children.push(bookmarkBlock);
                }
            }

            columnListBlock.column_list.children.push(column);
        }

        children.push(columnListBlock);
    }

    function embededContent(title, contentArray) {
        const totalElements = contentArray.length;
        const columns = 3; 
        const elementsPerColumn = Math.ceil(totalElements / columns);

        children.push({
            object: 'block',
            type: 'heading_2',
            heading_2: { rich_text: [{ text: { content: title } }] }
        });

        const columnListBlock = {
            object: 'block',
            type: 'column_list',
            column_list: {
                children: []
            }
        };

        for (let i = 0; i < columns; i++) {
            const column = {
                object: 'block',
                type: 'column',
                column: {
                    children: []
                }
            };

            for (let j = 0; j < elementsPerColumn; j++) {
                const index = i * elementsPerColumn + j;
                if (index < totalElements) {
                    const bookmarkBlock = {
                        object: 'block',
                        type: 'embed', 
                        embed: {
                            url: contentArray[index]
                        }
                    };
                    column.column.children.push(bookmarkBlock);
                }
            }

            columnListBlock.column_list.children.push(column);
        }

        children.push(columnListBlock);
    }

    function photoContent(title, contentArray) {
        const totalElements = contentArray.length;
        const columns = 3; 
        const elementsPerColumn = Math.ceil(totalElements / columns);

        children.push({
            object: 'block',
            type: 'heading_2',
            heading_2: { rich_text: [{ text: { content: title } }] }
        });

        const columnListBlock = {
            object: 'block',
            type: 'column_list',
            column_list: {
                children: []
            }
        };

        for (let i = 0; i < columns; i++) {
            const column = {
                object: 'block',
                type: 'column',
                column: {
                    children: []
                }
            };

            for (let j = 0; j < elementsPerColumn; j++) {
                const index = i * elementsPerColumn + j;
                if (index < totalElements) {
                    const imageBlock = {
                        object: 'block',
                        type: 'image',
                        image: {
                            type: 'file',
                            file: {
                            // url: contentArray[index].imageUrl
                                url: contentArray[index].imageUrl,
                                expiry_time: contentArray[index].imageExpiryTime
                            }
                        }
                    };
                    column.column.children.push(imageBlock);
                }
            }

            columnListBlock.column_list.children.push(column);
        }

        children.push(columnListBlock);
    }
    for (let i = 0; i < youtubeVideos.length; i++){
        youtubeVideos[i] = formatYouTubeUrl(youtubeVideos[i]);
    }

    console.log('Videos de YouTube:', youtubeVideos);
    console.log('Contenido de Instagram:', instagramContent);
    console.log('Contenido de Twitter:', twitterContent);
    console.log('Contenido de Internet:', internetContent);
    console.log('Imagenes:', photos);
    // embededContent("Instagram Content", instagramContent);
    embededContent("YouTube Videos", youtubeVideos);
    bookmarkedContent("Instagram Content", instagramContent);
    embededContent("Twitter Content", twitterContent);
    bookmarkedContent("Internet Content", internetContent);
    // bookmarkedContent("Photos", photos);
    
    // photoContent("Photos", photos);

    await notion.blocks.children.append({
        block_id: blockId,
        children: children
    });
}
