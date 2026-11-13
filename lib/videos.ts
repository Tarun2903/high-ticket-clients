// Student video testimonials (YouTube Shorts). URLs are used exactly as supplied.
// Thumbnails are the videos' own YouTube thumbnails (https://i.ytimg.com/vi/<id>/oar2.jpg, the vertical Shorts frame),
// stored in /public so the page doesn't depend on YouTube to render them. No names or claims are invented.

export const videoSection = {
  headline: "Student Success Stories",
  description: "Real experiences. Real transformations. Hear directly from students who have experienced the training.",
  label: "Student Video Testimonial",
} as const;

export type VideoTestimonial = { id: string; url: string; thumbnail: string };

export const videoTestimonials: VideoTestimonial[] = [
  {
    id: "dBQMSNXFsrc",
    url: "https://youtube.com/shorts/dBQMSNXFsrc?si=m6etgOrUDo71NAzS",
    thumbnail: "/images/video-testimonials/dBQMSNXFsrc.jpg",
  },
  {
    id: "jw4WmyKLpgM",
    url: "https://youtube.com/shorts/jw4WmyKLpgM?si=66jbtv_LnZNhGBm2",
    thumbnail: "/images/video-testimonials/jw4WmyKLpgM.jpg",
  },
  {
    id: "CGxlosyr78I",
    url: "https://youtube.com/shorts/CGxlosyr78I?si=IzXjJfuo3R6wbO-h",
    thumbnail: "/images/video-testimonials/CGxlosyr78I.jpg",
  },
];
