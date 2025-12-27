import { Admin, Resource } from "react-admin";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { arSA } from "@mui/material/locale";

import authProvider from "./providers/authProvider"; 
import dataProvider from "./providers/dataProvider";
import LoginPage from "./resources/auth/LoginPage";

import { ProjectList, ProjectCreate, ProjectEdit } from "./resources/projects";
import {
  ScreeningCreate,
  ScreeningEdit,
  ScreeningList,
  ScreeningShow,
} from "./resources/projects/screenings";


// تخصيص الثيم
const theme = createTheme(
  {
    direction: "rtl",
    palette: {
      mode: "light",
      primary: {
        main: "#2196F3",
      },
    },
  },
  arSA
);

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div dir="rtl">
        <Admin
          theme={theme}
          dataProvider={dataProvider}
          authProvider={authProvider}
          loginPage={LoginPage}
          requireAuth
        >
          <Resource
            name="projects"
            list={ProjectList}
            create={ProjectCreate}
            edit={ProjectEdit}
          />

          {/* <Resource
            name="screenings"
            list={ScreeningList}
            create={ScreeningCreate}
            edit={ScreeningEdit}
            show={ScreeningShow}
            options={{ label: "الفحوصات البيئية" }}
          /> */}
          <Resource
            name="screenings"
            list={ScreeningList}
            create={ScreeningCreate}
            edit={ScreeningEdit}
            show={ScreeningShow}
            options={{ label: "الفحوصات البيئية" }}
          />
        </Admin>
      </div>
    </ThemeProvider>
  );
};

export default App;