"use client";
import { FC, useState } from "react";
import Modal from "@mui/material/Modal";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

interface Artist {
  name: string;
  role: string;
  social: {
    instagram: string;
    x: string;
    tiktok: string;
  };
}

const artists: Artist[] = [
  {
    name: "Bootsy Collins",
    role: "Writer/Performer/Producer",
    social: {
      instagram: "https://instagram.com/bootsy_collins",
      x: "https://x.com/Bootsy_Collins",
      tiktok: "https://tiktok.com/@bootsy_collins",
    },
  },
  {
    name: "Blü",
    role: "Writer/Performer/Producer",
    social: {
      instagram: "https://instagram.com/blu_is_you",
      x: "https://x.com/blu_is_you",
      tiktok: "https://tiktok.com/@blu_is_you",
    },
  },
  {
    name: "Westcoast Stone",
    role: "Talkbox/Mastering",
    social: {
      instagram: "https://instagram.com/westcoaststone",
      x: "https://x.com/west_stone29160",
      tiktok: "https://tiktok.com/@westcoaststone",
    },
  },
];

export const SocialLinks: FC = () => {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const handleOpen = (artist: Artist) => {
    setSelectedArtist(artist);
  };

  const handleClose = () => {
    setSelectedArtist(null);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-center space-x-2">
        {artists.slice(0, 2).map((artist, index) => (
          <>
            <button
              key={artist.name}
              onClick={() => handleOpen(artist)}
              className="text-2xl font-bold text-blue-500 hover:text-blue-700 transition-colors"
            >
              {artist.name}
            </button>
            {index === 0 && (
              <span className="text-2xl font-bold text-blue-500">&</span>
            )}
          </>
        ))}
      </div>
      <button
        onClick={() => handleOpen(artists[2])}
        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        MASTERING BY: {artists[2].name}
      </button>

      <Modal
        open={!!selectedArtist}
        onClose={handleClose}
        aria-labelledby="social-links-modal"
        closeAfterTransition
      >
        <Container
          maxWidth="sm"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Card
            variant="elevation"
            sx={{
              p: 2,
            }}
          >
            <CardHeader
              title={
                <Typography
                  variant="h5"
                  component="h2"
                  textAlign="center"
                  sx={{ mb: 1 }}
                >
                  {selectedArtist?.name}
                </Typography>
              }
              subheader={
                <Typography
                  variant="subtitle1"
                  textAlign="center"
                  color="text.secondary"
                >
                  {selectedArtist?.role}
                </Typography>
              }
            />
            <CardContent>
              <MenuList>
                <MenuItem
                  component="a"
                  href={selectedArtist?.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ListItemIcon>
                    <InstagramIcon />
                  </ListItemIcon>
                  <ListItemText>Instagram</ListItemText>
                </MenuItem>
                <MenuItem
                  component="a"
                  href={selectedArtist?.social.x}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ListItemIcon>
                    <TwitterIcon />
                  </ListItemIcon>
                  <ListItemText>X (Twitter)</ListItemText>
                </MenuItem>
                <MenuItem
                  component="a"
                  href={selectedArtist?.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ListItemIcon>
                    <MusicNoteIcon />
                  </ListItemIcon>
                  <ListItemText>TikTok</ListItemText>
                </MenuItem>
              </MenuList>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </div>
  );
};
