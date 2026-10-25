import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { momentsService } from '@/services/moments.service';
import type { CreateMomentPayload } from '@/types/moment';

export const momentKeys = {
  all: ['moments'] as const,
  feed: ['moments', 'feed'] as const,
};

export function useMomentsFeed() {
  return useInfiniteQuery({
    queryKey: momentKeys.feed,
    queryFn: () => momentsService.getFeed(),
    initialPageParam: 1,
    getNextPageParam: () => undefined,
  });
}

export function useCreateMoment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMomentPayload) => momentsService.createMoment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentKeys.feed });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; isLiked?: boolean }) => momentsService.toggleLike(id),
    onMutate: async ({ id, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: momentKeys.feed });
      const previous = queryClient.getQueryData(momentKeys.feed);

      queryClient.setQueryData(momentKeys.feed, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('pages' in old)) return old;
        const data = old as {
          pages: { data: { id: string; isLiked: boolean; likesCount: number }[] }[];
        };
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            data: page.data.map((moment) =>
              moment.id === id
                ? {
                    ...moment,
                    isLiked: !isLiked,
                    likesCount: moment.likesCount + (isLiked ? -1 : 1),
                  }
                : moment,
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(momentKeys.feed, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: momentKeys.feed });
    },
  });
}
