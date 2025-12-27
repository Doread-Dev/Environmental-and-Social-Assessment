import { httpClient } from "../utils/httpClient";

const dataProvider = {
  // جلب القائمة (GET /api/v1/projects)
  getList: async (resource, params) => {
    // console.log("🔍 GETLIST - Resource:", resource);

    const response = await httpClient(`/api/v1/${resource}`);

    // console.log("📨 API Response:", response.json);

    let rawData = [];

    if (response.json && response.json.data) {
      rawData = response.json.data; 
    } else if (Array.isArray(response.json)) {
      rawData = response.json; 
    }

    // console.log("📊 Raw data:", rawData);

    const items = rawData.map((item) => {
      const transformed = {
        ...item,
        id: item._id || item.id,
      };

      // console.log("🔄 Transformed item:", transformed);
      return transformed;
    });

    return {
      data: items,
      total: items.length,
    };
  },

  getOne: async (resource, params) => {
    const response = await httpClient(`/api/v1/${resource}/${params.id}`);
    // const item = response.json;
    let itemData;

    if (response.json && response.json.data) {
      itemData = response.json.data; 
    } else {
      itemData = response.json; 
    }

    return {
      data: {
        id: itemData._id,
        ...itemData,
      },
    };
  },

  create: async (resource, params) => {
    const response = await httpClient(`/api/v1/${resource}`, {
      method: "POST",
      body: JSON.stringify(params.data),
    });

    return {
      data: {
        ...params.data,
        id: response.json._id,
      },
    };
  },
  // تحديث (PUT /api/v1/projects/:id)
  update: async (resource, params) => {
    const url = `/api/v1/${resource}/${params.id}`;
    const response = await httpClient(url, {
      method: "PUT",
      body: JSON.stringify(params.data),
    });

    let itemData;

    if (response.json && response.json.data) {
      itemData = response.json.data; 
    } else {
      itemData = response.json; 
    }

    return {
      data: {
        itemData,
        id: itemData._id,
      },
    };
  },

  // حذف (DELETE /api/v1/projects/:id)
  delete: async (resource, params) => {
    const url = `/api/v1/${resource}/${params.id}`;
    await httpClient(url, {
      method: "DELETE",
    });

    return {
      data: { id: params.id },
    };
  },

  // حذف متعدد
  deleteMany: async (resource, params) => {
    const promises = params.ids.map((id) =>
      httpClient(`/api/v1/${resource}/${id}`, {
        method: "DELETE",
      })
    );

    await Promise.all(promises);

    return {
      data: params.ids.map((id) => ({ id })),
    };
  },

  // تحديث متعدد
  updateMany: async (resource, params) => {
    const promises = params.ids.map((id) =>
      httpClient(`/api/v1/${resource}/${id}`, {
        method: "PUT",
        body: JSON.stringify(params.data),
      })
    );

    const responses = await Promise.all(promises);

    return {
      data: params.ids.map((id, index) => ({
        id,
        ...responses[index].json,
      })),
    };
  },

  // للحصول على الخيارات (مثلاً للـ ReferenceInput)
  //   getMany: async (resource, params) => {
  //     const promises = params.ids.map((id) =>
  //       httpClient(`/api/v1/${resource}/${id}`)
  //     );

  //     const responses = await Promise.all(promises);

  //     return {
  //       data: responses.map((response) => response.json),
  //     };
  //   },

  // للبحث
  //   getManyReference: async (resource, params) => {
  //     const { page, perPage } = params.pagination;
  //     const { field, order } = params.sort;

  //     const query = new URLSearchParams({
  //       page: page,
  //       perPage: perPage,
  //       sort: field,
  //       order: order,
  //       [params.target]: params.id,
  //     });

  //     const url = `/api/v1/${resource}?${query}`;
  //     const response = await httpClient(url);

  //     return {
  //       data: response.json.data,
  //       total: response.json.total || response.json.data.length,
  //     };
  //   },
};

export default dataProvider;
