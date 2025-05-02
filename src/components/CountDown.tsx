import { FC, useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import ReactCountDown from "react-countdown";

const END_DATE = new Date("2023-04-27T17:20:00.000Z");
const SIZED_COUNTER = {
  typography: {
    sm: "p",
    lg: "p",
  },
};
const SIZED_TEXT = {
  typography: {
    sm: "p",
    lg: "p",
  },
};

const CELL_SIZE = {
  xs: 12,
  sm: 6,
  md: 3,
};
export const CountDown: FC<{
  onEnd?: () => void;
  endDate?: Date;
}> = ({ onEnd, endDate = END_DATE }) => {
  const [start, setStart] = useState(false);
  useEffect(() => {
    setStart(true);
  }, []);

  return start ? (
    <ReactCountDown
      date={endDate}
      renderer={({ days, hours, minutes, seconds, completed }) => {
        if (completed) {
          onEnd?.();
        }
        return (
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            spacing={1}
          >
            {days > 0 && (
              <Grid item {...CELL_SIZE}>
                <Box
                  component="div"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={SIZED_COUNTER}
                    component="span"
                    color="text.primary"
                  >
                    {days}
                  </Typography>
                  <Typography
                    sx={SIZED_TEXT}
                    component="span"
                    marginLeft={3}
                    color="text.primary"
                    noWrap
                  >
                    Days
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item {...CELL_SIZE}>
              <Box
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={SIZED_COUNTER}
                  component="span"
                  color="text.primary"
                >
                  {hours}
                </Typography>
                <Typography
                  sx={SIZED_TEXT}
                  component="span"
                  marginLeft={3}
                  color="text.primary"
                  noWrap
                >
                  Hours
                </Typography>
              </Box>
            </Grid>
            <Grid item {...CELL_SIZE}>
              <Box
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={SIZED_COUNTER}
                  component="span"
                  color="text.primary"
                >
                  {minutes.toString().padStart(2, "0")}
                </Typography>
                <Typography
                  sx={SIZED_TEXT}
                  component="span"
                  marginLeft={3}
                  color="text.primary"
                  noWrap
                >
                  Minutes
                </Typography>
              </Box>
            </Grid>
            <Grid item {...CELL_SIZE}>
              <Box
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={SIZED_COUNTER}
                  component="span"
                  color="text.primary"
                >
                  {seconds.toString().padStart(2, "0")}
                </Typography>
                <Typography
                  sx={SIZED_TEXT}
                  component="span"
                  marginLeft={3}
                  color="text.primary"
                  noWrap
                >
                  Seconds
                </Typography>
              </Box>
            </Grid>
          </Grid>
        );
      }}
    />
  ) : null;
};
