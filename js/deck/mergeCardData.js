// js/mergeCardData.js

// 1. 标准化函数，用于模糊匹配名称
// 移除了 replace(/\(.*?\)/g, '')，因为 cardcode.json 的 name 里可能有括号
function normalizeKey(str) {
    if (!str) return '';
    return str
        .replace(/（.*?）/g, '') // 去掉中文括号及其内容 (例如 "第 13 龙骑兵团 （世纪大战）" -> "第 13 龙骑兵团 ")
        // .replace(/\(.*?\)/g, '') // 暂时保留英文括号，因为 cardcode.json 的 name 通常不含描述性括号
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 只保留中英文、数字和空格 (移除标点符号)
        .toLowerCase()
        .trim(); // 去掉首尾空格
}

// 2. 创建 cardcode 数据的映射表
function createCardCodeMaps(cardCodeData) {
    const normalizedMap = {}; // 以 normalizeKey(name) 为键
    const rawMap = {};        // 以原始 name 为键
    cardCodeData.forEach(item => {
        // 保证数据完整性，过滤掉没有 importId 的项 (虽然理论上都应该有)
        if (item.name !== undefined && item.importId !== undefined) {
            const normalizedName = normalizeKey(item.name);
            // 处理可能的重复名称，保留第一个有效的
            if (normalizedName && !normalizedMap[normalizedName]) {
                normalizedMap[normalizedName] = item;
            }
            // 以原始名称为键的映射
            if (item.name && !rawMap[item.name]) {
                rawMap[item.name] = item;
            }
        }
    });
    return { normalizedMap, rawMap };
}

// 3. 合并数据的主函数
function mergeCardData(cardCodeData, allCardData) {
    const { normalizedMap, rawMap } = createCardCodeMaps(cardCodeData);
    const result = [];
    const unmatchedCards = []; // 用于存储未匹配的卡牌名称

    allCardData.forEach(card => {
        const cardName = card.名称;
        if (!cardName) {
            console.warn("发现一张没有名称的卡牌:", card);
            return; // 跳过没有名称的卡牌
        }

        let codeEntry = null;
        const normalizedName = normalizeKey(cardName);

        // 尝试1: 使用标准化名称匹配
        if (normalizedMap[normalizedName]) {
            codeEntry = normalizedMap[normalizedName];
        }
        // 尝试2: 如果标准化匹配失败，使用原始名称匹配
        else if (rawMap[cardName]) {
            codeEntry = rawMap[cardName];
            // 如果原始名称能匹配，说明 normalizeKey 可能需要调整
            console.log(`Info: 原始名称匹配成功 '${cardName}'，标准化名称 '${normalizedName}' 未匹配。`);
        }

        // 如果找到匹配项
        if (codeEntry) {
            result.push({
                importId: String(codeEntry.importId), // 确保是字符串
                国家: String(card.国家), // 确保是字符串
                名称: String(card.名称), // 确保是字符串
                类型: String(card.详细信息.类型), // 确保是字符串
                指挥点: String(card.详细信息.指挥点), // 确保是字符串
            });
        } else {
            // 如果未找到匹配项，记录下来
            unmatchedCards.push(cardName);
        }
    });

    // 打印所有未匹配的卡牌名称
    if (unmatchedCards.length > 0) {
        console.groupCollapsed(`未能匹配到 importId 的卡牌 (共 ${unmatchedCards.length} 张):`);
        console.warn(unmatchedCards.join('\n'));
        console.groupEnd();
    } else {
        console.log("所有卡牌均已成功匹配到 importId。");
    }

    return result;
}

// 4. 导出函数供其他模块使用
// 如果你的环境支持 ES6 模块
// export { mergeCardData, normalizeKey };

// 如果在浏览器环境中，可以挂载到 window 对象
// window.mergeCardData = mergeCardData;
// window.normalizeKey = normalizeKey;

// 5. 如果需要直接在 HTML 中执行合并逻辑，可以添加以下代码
// (请确保在 HTML 中先加载 cardcode.json 和 all_card.json 数据到全局变量)
/*
document.addEventListener('DOMContentLoaded', async function () {
    if (typeof cardCodeData !== 'undefined' && typeof allCardData !== 'undefined') {
        console.log("开始合并卡牌数据...");
        const mergedData = mergeCardData(cardCodeData, allCardData);
        console.log("合并完成，结果:", mergedData);
        // 你可以将 mergedData 存储到全局变量或传递给其他函数
        window.mergedCardData = mergedData;
    } else {
        console.error("错误：未找到 cardCodeData 或 allCardData。请确保数据已正确加载。");
        // 尝试从文件加载
        try {
            console.log("尝试从文件加载数据...");
            const [cardCodeResponse, allCardResponse] = await Promise.all([
                fetch('data/cardcode.json'),
                fetch('data/all_card.json')
            ]);
            const cardCodeDataLoaded = await cardCodeResponse.json();
            const allCardDataLoaded = await allCardResponse.json();
            
            console.log("开始合并卡牌数据...");
            const mergedData = mergeCardData(cardCodeDataLoaded, allCardDataLoaded);
            console.log("合并完成，结果:", mergedData);
            window.mergedCardData = mergedData;
        } catch (error) {
            console.error("加载或合并卡牌数据时出错:", error);
        }
    }
});
*/