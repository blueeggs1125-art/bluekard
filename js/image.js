
function getImagesForCountry(country, subtype = null) {
    return fetch('data/images.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应错误');
            }
            return response.json();
        })
        .then(data => {
            if (subtype) {
                return data[country]?.[subtype] || [];
            } else {
                return data[country] || [];
            }
        })
        .catch(error => {
            console.error('加载图片数据失败:', error);
            return [];
        });
}