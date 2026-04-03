interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const data: ISiteMetadataResult = {
  siteTitle: 'Workout Page',
  siteUrl: '/',
  logo: 'https://avatars.githubusercontent.com/u/39235427?v=4',
  description: 'Personal workout dashboard',
  navLinks: [],
};

export default data;
