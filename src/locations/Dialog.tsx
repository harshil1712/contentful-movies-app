import React, { useEffect, useState } from 'react';
import { Spinner, Stack, EntityList } from '@contentful/f36-components';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';

export interface Movie {
  title: string;
  poster_path: string;
  overview: string;
}

const Dialog = () => {
  const sdk = useSDK<DialogExtensionSDK>();
  useAutoResizer();

  const [movie, setMovie] = useState<Movie[] | undefined>();

  const { apiKey } = sdk.parameters.installation;

  const fetchData = async (searchTerm: string) => {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${searchTerm}`
    );
    const { results } = await response.json();
    setMovie(results);
  };

  useEffect(() => {
    // @ts-expect-error
    fetchData(sdk.parameters.invocation.movieName);
  }, [sdk.parameters.invocation]);

  if (!movie) {
    return <Spinner size="large" />;
  }
  return (
    <Stack fullWidth>
      <EntityList
        style={{
          width: '100%',
        }}
      >
        {movie.map((item, i) => {
          return (
            <EntityList.Item
              key={i}
              title={item.title}
              thumbnailUrl={`http://image.tmdb.org/t/p/w500/${item.poster_path}`}
              onClick={() =>
                sdk.close({
                  name: item.title,
                  image: `http://image.tmdb.org/t/p/w500/${item.poster_path}`,
                  description: item.overview
                })
              }
            />
          );
        })}
      </EntityList>
    </Stack>
  );
};

export default Dialog;
