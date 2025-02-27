import axios from "axios";
import { RegisterUser } from "../page/register/Register";
import { UpdatePassword } from "../page/update_password/UpdatePassword";
import { UserInfo } from "../page/update_info/UpdateInfo";

import { message } from "antd";
import { SearchBooking } from "../page/booking_history/BookingHistory";
import dayjs from "dayjs";
import { CreateBooking } from "../page/meeting_room_list/CreateBookingModal";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3005/",
  timeout: 3000,
});

axiosInstance.interceptors.request.use(function (config) {
  const accessToken = localStorage.getItem("access_token");

  if (accessToken && accessToken !== undefined) {
    config.headers.authorization = "Bearer " + accessToken;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // console.log('[ error ] >', error);
    let { data, config } = error.response;
 console.log('[ data ] >', data);
    if (data.code === 401 && !config.url.includes("/user/refresh")) {
      const res = await refreshToken();
      if (res) {
        let { status } = res;
        if (status === 200 || status === 201) {
          return axiosInstance(config);
        } else {
          message.error(res.data.data);
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
        }
      }
    } else {
      if (data.code === 400 || data.code === 401) {
        message.error(data.data);
         setTimeout(() => {
          window.location.href = "/login";
        }, 1000)
      } else {
        return Promise.reject(error.response); // 将错误抛出
      }
    }
  }
);

async function refreshToken() {
  const res = await axiosInstance.get("/user/refresh", {
    params: {
      refresh_token: localStorage.getItem("refresh_token"),
    },
  });
  if (res) {
    localStorage.setItem("access_token", res.data.data.access_token);
    localStorage.setItem("refresh_token", res.data.data.refresh_token);
    return res;
  } else { 
    localStorage.setItem("access_token", "");
    localStorage.setItem("refresh_token", "");
    return null;
  }
 

  
}

export async function login(username: string, password: string) {
  return await axiosInstance.post("/user/login", {
    username,
    password,
  });
}

export async function registerCaptcha(email: string) {
  return await axiosInstance.get("/user/register-captcha", {
    params: {
      address: email,
    },
  });
}

export async function register(registerUser: RegisterUser) {
  return await axiosInstance.post("/user/register", registerUser);
}

export async function updatePasswordCaptcha(email: string) {
  return await axiosInstance.get("/user/update_password/captcha", {
    params: {
      address: email,
    },
  });
}

export async function updatePassword(data: UpdatePassword) {
  return await axiosInstance.post("/user/update_password", data);
}

export async function getUserInfo() {
  return await axiosInstance.get("/user/info");
}

export async function updateInfo(data: UserInfo) {
  return await axiosInstance.post("/user/update", data);
}

export async function updateUserInfoCaptcha() {
  return await axiosInstance.get("/user/update/captcha");
}

export async function searchMeetingRoomList(
  name: string,
  capacity: number,
  equipment: string,
  pageNo: number,
  pageSize: number
) {
  return await axiosInstance.get("/meeting-room/list", {
    params: {
      name,
      capacity,
      equipment,
      pageNo,
      pageSize,
    },
  });
}

export async function bookingList(
  searchBooking: SearchBooking,
  pageNo: number,
  pageSize: number
) {
  let bookingTimeRangeStart;
  let bookingTimeRangeEnd;

  //开始时间
  let rangeStartTimeStr = "";
  if (searchBooking.rangeStartTime) {
    rangeStartTimeStr = dayjs(searchBooking.rangeStartTime).format("HH:mm");
  }

  //开始日期+时间拼接
  if (searchBooking.rangeStartDate) {
    const rangeStartDateStr = dayjs(searchBooking.rangeStartDate).format(
      "YYYY-MM-DD"
    );

    bookingTimeRangeStart = dayjs(
      rangeStartDateStr + " " + rangeStartTimeStr
    ).valueOf();
  }

  //结束时间需要判断是否有时间
  if (searchBooking.rangeEndDate && searchBooking.rangeEndTime) {
    const rangeEndDateStr = dayjs(searchBooking.rangeEndDate).format(
      "YYYY-MM-DD"
    );
    const rangeEndTimeStr = dayjs(searchBooking.rangeEndTime).format("HH:mm");
    bookingTimeRangeEnd = dayjs(
      rangeEndDateStr + " " + rangeEndTimeStr
    ).valueOf();
  }

  return await axiosInstance.get("/booking/list", {
    params: {
      username: searchBooking.username,
      meetingRoomName: searchBooking.meetingRoomName,
      meetingRoomPosition: searchBooking.meetingRoomPosition,
      bookingTimeRangeStart,
      bookingTimeRangeEnd,
      pageNo: pageNo,
      pageSize: pageSize,
    },
  });
}
export async function unbind(id: number) {
  return await axiosInstance.get("/booking/unbind/" + id);
}

export async function bookingAdd(booking: CreateBooking) {
  const rangeStartDateStr = dayjs(booking.rangeStartDate).format("YYYY-MM-DD");
  const rangeStartTimeStr = dayjs(booking.rangeStartTime).format("HH:mm");
  const startTime = dayjs(
    rangeStartDateStr + " " + rangeStartTimeStr
  ).valueOf();

  const rangeEndDateStr = dayjs(booking.rangeEndDate).format("YYYY-MM-DD");
  const rangeEndTimeStr = dayjs(booking.rangeEndTime).format("HH:mm");
  const endTime = dayjs(rangeEndDateStr + " " + rangeEndTimeStr).valueOf();

  return await axiosInstance.post("/booking/add", {
    meetingRoomId: booking.meetingRoomId,
    startTime,
    endTime,
    note: booking.note,
  });
}
