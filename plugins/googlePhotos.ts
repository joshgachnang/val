// Description:
//   Access your Google photos
//
// Commands:
//   @bot show a photo - Pick a random picture from the configured album.
//
// Author:
//   pcsforeducation

import Response from "../response";
import Robot from "../robot";

const ALBUM_NAME = "ChoeNang Family";

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

class GooglePhotos {
  robot: Robot;
  albumIds: {[userId: string]: string} = {};
  photoCache: {[userId: string]: any} = {};

  init(robot: Robot) {
    this.robot = robot;
    robot.router.get("/google/randomPhoto", async (req, res) => {
      if (!res.locals.userId) {
        return res.status(401).send();
      }
      try {
        await this.robot.oauth.authorize(res.locals.userId);
        console.log("USERID", res.locals.userId);
        let photo = await this.getRandomPhoto(res.locals.userId);
        res.json({photo});
      } catch (e) {
        this.robot.logger.warn("[googlePhoto] error authorizing:", e);
        res.status(400).send({error: e});
      }
    });

    robot.respond(`random photo`, {}, async (response: Response) => {
      const random = await this.getRandomPhoto(response.userId);
      console.log(random);
      response.reply(random);
    });

    setInterval(this.cacheAllPhotos, 60 * 60 * 1000);
  }

  private async apiRequest(
    userId: string,
    url: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ) {
    let token = await this.robot.oauth.getToken(userId);
    if (!token) {
      throw new Error(`[googlePhotos] no auth token set up`);
    }
    console.log("TOKEN", token);
    let res = await this.robot.request({
      url: `https://photoslibrary.googleapis.com/v1/${url}`,
      method: method,
      body: body,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });
    return JSON.parse(res);
  }

  getAlbumId = async (userId: string) => {
    if (this.albumIds[userId]) {
      return this.albumIds[userId];
    }
    let res = await this.apiRequest(userId, "albums");
    if (!res.albums) {
      this.robot.logger.warn(`[googlePhotos] albums was null, cannot get album id.`);
      return;
    }
    let album = res.albums.find((album) => album.title === ALBUM_NAME);
    if (!album) {
      throw new Error(`[googlePhotos] could not find album matching ${ALBUM_NAME}`);
    }
    this.albumIds[userId] = album.id;
    return album.id;
  };

  getPhotosFromAlbum = async (userId: string, albumId: string, pageToken?: string) => {
    let body: any = {albumId, pageSize: 100};
    if (pageToken) {
      body.pageToken = pageToken;
    }
    return this.apiRequest(userId, "mediaItems:search", "POST", JSON.stringify(body));
  };

  cachePhotos = async (userId): Promise<void> => {
    let albumId = await this.getAlbumId(userId);
    let res = await this.getPhotosFromAlbum(userId, albumId);
    let photos = res.mediaItems;

    while (res.nextPageToken) {
      res = await this.getPhotosFromAlbum(userId, albumId, res.nextPageToken);
      photos = photos.concat(res.mediaItems);
    }
    this.robot.logger.info(
      `[googlePhotos] cached ${photos ? photos.length : 0} photos for user id: ${userId}`
    );
    this.photoCache[userId] = photos;
  };

  cacheAllPhotos = async () => {
    for (let userId of Object.keys(this.photoCache)) {
      await this.cachePhotos(userId);
    }
  };

  getRandomPhoto = async (userId: string): Promise<string> => {
    if (!this.photoCache[userId]) {
      await this.cachePhotos(userId);
    }
    let photo = pickRandom(this.photoCache[userId]);
    console.log("PHOTO", photo);
    let item = await this.apiRequest(userId, `mediaItems/${photo.mediaItemId}`, "GET");
    return item.baseUrl;
  };
}

const photos = new GooglePhotos();
export default photos;
