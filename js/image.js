// 图片处理工具函数

// 添加一个新函数用于处理包含中文的图片路径
function encodeImagePath(path) {
    // 将路径中的每个部分进行编码，但保持分隔符不变
    return path.split('/').map(part => encodeURIComponent(part)).join('/');
}

// 根据关键词搜索图片
function searchImagesByKeyword(keyword) {
    return fetch('data/newimages.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('newimages.json 网络响应错误');
            }
            return response.json();
        })
        .then(imagesData => {
            const results = [];
            const searchKeyword = keyword.trim().toLowerCase();
            const addedPaths = new Set(); // 用于避免重复添加
            
            // 遍历 newimages.json 中的图片数据
            for (const country in imagesData) {
                if (!imagesData.hasOwnProperty(country)) continue;
                
                const countryData = imagesData[country];
                
                // 如果国家数据是数组格式（总部、卡背等没有子类型）
                if (Array.isArray(countryData)) {
                    countryData.forEach(imagePath => {
                        const fileName = imagePath.split('/').pop();
                        // 只检查文件名是否匹配关键词（不区分大小写）
                        if (fileName.toLowerCase().includes(searchKeyword)) {
                            // 避免重复添加
                            if (!addedPaths.has(imagePath)) {
                                addedPaths.add(imagePath);
                                results.push({
                                    path: imagePath,
                                    name: fileName,
                                    description: ''
                                });
                            }
                        }
                    });
                } 
                // 如果国家数据是对象格式（有子类型：金卡、银卡等）
                else {
                    for (const subtype in countryData) {
                        if (!countryData.hasOwnProperty(subtype)) continue;
                        
                        countryData[subtype].forEach(imagePath => {
                            const fileName = imagePath.split('/').pop();
                            // 只检查文件名是否匹配关键词（不区分大小写）
                            if (fileName.toLowerCase().includes(searchKeyword)) {
                                // 避免重复添加
                                if (!addedPaths.has(imagePath)) {
                                    addedPaths.add(imagePath);
                                    results.push({
                                        path: imagePath,
                                        name: fileName,
                                        description: ''
                                    });
                                }
                            }
                        });
                    }
                }
            }
            
            return results;
        })
        .catch(error => {
            console.error('搜索图片失败:', error);
            return [];
        });
}

// 获取所有图片用于显示
async function getAllImages() {
    try {
        const response = await fetch('data/newimages.json');
        if (!response.ok) {
            throw new Error('newimages.json 网络响应错误');
        }
        const imagesData = await response.json();
        
        const allImages = [];
        
        // 遍历所有图片数据
        for (const country in imagesData) {
            if (!imagesData.hasOwnProperty(country)) continue;
            
            const countryData = imagesData[country];
            
            // 如果国家数据是数组格式（总部、卡背等没有子类型）
            if (Array.isArray(countryData)) {
                allImages.push(...countryData);
            } 
            // 如果国家数据是对象格式（有子类型：金卡、银卡等）
            else {
                for (const subtype in countryData) {
                    if (!countryData.hasOwnProperty(subtype)) continue;
                    allImages.push(...countryData[subtype]);
                }
            }
        }
        
        return allImages;
    } catch (error) {
        console.error('获取图片列表失败:', error);
        return [];
    }
}

// 根据国家和类型获取图片
async function getImagesForCountry(country, subtype = null) {
    try {
        const response = await fetch('data/newimages.json');
        if (!response.ok) {
            throw new Error('newimages.json 网络响应错误');
        }
        const imagesData = await response.json();
        
        let filteredImages = [];
        
        // 根据国家和子类型筛选图片
        if (imagesData[country]) {
            if (subtype && imagesData[country][subtype]) {
                // 有子类型的情况
                filteredImages = imagesData[country][subtype];
            } else {
                // 没有子类型的情况（总部、卡背等）
                filteredImages = imagesData[country];
            }
        }
        
        return filteredImages;
    } catch (error) {
        console.error('获取图片列表失败:', error);
        return [];
    }
}

// 导出函数（如果在模块环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        encodeImagePath,
        searchImagesByKeyword,
        getAllImages,
        getImagesForCountry
    };
}