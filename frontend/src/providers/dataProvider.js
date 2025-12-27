import { httpClient } from "../utils/httpClient";

const dataProvider = {
  // جلب القائمة (GET /api/v1/projects)
  getList: async (resource, params) => {
    console.log("🔍 GETLIST - Resource:", resource);

    const response = await httpClient(`/api/v1/${resource}`);

    let rawData = [];
    if (response.json && response.json.data) {
      rawData = response.json.data;
    } else if (Array.isArray(response.json)) {
      rawData = response.json;
    }

    const items = rawData.map((item) => {
      const transformed = {
        ...item,
        id: item._id || item.id,
      };

      // ⭐⭐⭐⭐ احتفظ بـ project كـ object للعرض ⭐⭐⭐⭐
      // لا تحوله هنا، دعيه كـ object
      // لأنه يظهر في القائمة كمشروع كامل

      return transformed;
    });

    return {
      data: items,
      total: items.length,
    };
  }, 
  getOne: async (resource, params) => {
    console.log("🔍 GET_ONE called:", { resource, id: params.id });

    const response = await httpClient(`/api/v1/${resource}/${params.id}`);

    console.log("📨 GET_ONE response.json:", response.json);

    let itemData;
    if (response.json && response.json.data) {
      itemData = response.json.data;
    } else {
      itemData = response.json;
    }

    // ⭐⭐⭐⭐ لا تحول project! أبقيه كـ object ⭐⭐⭐⭐
    const transformedData = {
      ...itemData,
      id: itemData._id || itemData.id,
    };

    console.log(
      "✅ GET_ONE returning with project as object:",
      transformedData
    );

    return {
      data: transformedData,
    };
  },
  create: async (resource, params) => {
    const response = await httpClient(`/api/v1/${resource}`, {
      method: "POST",
      body: JSON.stringify(params.data),
    });
    let itemData;
    if (response.json && response.json.data) {
      itemData = response.json.data;
    } else {
      itemData = response.json;
    }
    console.log(` the data ${itemData}`);

    return {
      data: {
        ...params.data,
        id: itemData._id,
      },
    };
  },


  update: async (resource, params) => {
    const dataToSend = { ...params.data };

    if (dataToSend.project && typeof dataToSend.project === "object") {
      dataToSend.project = dataToSend.project._id || dataToSend.project.id;
    }

    ["id", "_id", "createdAt", "updatedAt", "__v"].forEach((f) => {
      delete dataToSend[f];
    });

    const response = await httpClient(`/api/v1/${resource}/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(dataToSend),
    });

    const itemData = response.json.data || response.json;
console.log("📤 FINAL DATA SENT TO API:", dataToSend);

    return {
      data: {
        ...itemData,
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
  getMany: async (resource, params) => {
    console.log("🔍 GET_MANY called for:", resource);

    if (
      resource === "projects" &&
      params.ids.length > 0 &&
      typeof params.ids[0] === "object"
    ) {
      console.log("📊 Returning projects data directly from params.ids");

      const data = params.ids.map((item) => ({
        ...item,
        id: item._id || item.id,
      }));

      return { data };
    }

    // المنطق القديم للموارد الأخرى
    const ids = params.ids
      .map((item) => {
        if (typeof item === "object") {
          return item._id || item.id;
        }
        return item;
      })
      .filter((id) => id);

    const promises = ids.map((id) => httpClient(`/api/v1/${resource}/${id}`));

    const responses = await Promise.all(promises);

    const data = responses.map((response) => {
      let itemData;

      if (response.json && response.json.data) {
        itemData = response.json.data;
      } else {
        itemData = response.json;
      }

      return {
        ...itemData,
        id: itemData._id || itemData.id,
      };
    });

    return { data };
  },
  // للبحث
  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const query = new URLSearchParams({
      page: page,
      perPage: perPage,
      sort: field,
      order: order,
      [params.target]: params.id,
    });

    const url = `/api/v1/${resource}?${query}`;
    const response = await httpClient(url);

    return {
      data: response.json.data,
      total: response.json.total || response.json.data.length,
    };
  },

  approveScreening: async (id, action) => {
    try {
      console.log(`📝 approveScreening called: ${id}, ${action}`);

      const response = await httpClient(`/api/v1/screenings/${id}/${action}`, {
        method: "PATCH",
      });

      console.log("✅ Response:", response.json);

      return {
        data: response.json,
      };
    } catch (error) {
      console.error(`${action.toUpperCase()} error:`, error);
      throw error;
    }
  },
  getProjectScreening: async (projectId) => {
    try {
      const response = await httpClient(
        `/api/v1/projects/${projectId}/screening`
      );

      return {
        data: response.json,
      };
    } catch (error) {
      console.error("Get project screening error:", error);
      throw error;
    }
  },
};



export default dataProvider;
