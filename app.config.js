export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
      name: "PetGroomers Groomer",
      slug: "petgroomers-groomer-app",
      scheme: "petgroomers-groomer",
    },
  };
};