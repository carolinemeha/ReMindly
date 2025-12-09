import { supabase } from '@/lib/supabase';
import { Group, GroupMember, CreateGroupInput } from '@/types';

class GroupsService {
  async getGroups() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Récupérer les groupes où l'utilisateur est propriétaire
    const { data: ownedGroups, error: ownedError } = await supabase
      .from('groups')
      .select(`
        *,
        members:group_members(*)
      `)
      .eq('owner_id', user.id);

    if (ownedError) throw ownedError;

    // Récupérer les groupes où l'utilisateur est membre
    const { data: memberGroups, error: memberError } = await supabase
      .from('group_members')
      .select(`
        group:groups(
          *,
          members:group_members(*)
        )
      `)
      .eq('user_id', user.id);

    if (memberError) throw memberError;

    // Combiner et dédupliquer
    const allGroups = [
      ...(ownedGroups || []),
      ...(memberGroups?.map((m: any) => m.group).filter(Boolean) || []),
    ];

    // Dédupliquer par ID
    const uniqueGroups = Array.from(
      new Map(allGroups.map((g: any) => [g.id, g])).values()
    );

    return uniqueGroups as Group[];
  }

  async getGroupById(id: string) {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        members:group_members(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Group & { members: GroupMember[] };
  }

  async createGroup(input: CreateGroupInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Créer le groupe
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: input.name,
        description: input.description,
        owner_id: user.id,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Ajouter les membres si des emails sont fournis
    if (input.member_emails && input.member_emails.length > 0) {
      // Récupérer les IDs des utilisateurs par email depuis auth.users
      // Note: Supabase n'expose pas directement auth.users, on doit utiliser une fonction ou une vue
      // Pour l'instant, on va chercher via les emails dans les métadonnées
      // Une meilleure approche serait de créer une vue ou fonction dans Supabase
      const { data: users, error: usersError } = await supabase.rpc(
        'get_users_by_emails',
        { emails: input.member_emails }
      ).catch(async () => {
        // Fallback: si la fonction n'existe pas, on ne peut pas ajouter les membres automatiquement
        // L'utilisateur devra les ajouter manuellement
        console.warn('Fonction get_users_by_emails non disponible. Les membres devront être ajoutés manuellement.');
        return { data: null, error: null };
      });

      if (usersError) {
        console.error('Erreur lors de la récupération des utilisateurs:', usersError);
      } else if (users && users.length > 0) {
        const members = users.map((u) => ({
          group_id: group.id,
          user_id: u.id,
          role: 'member' as const,
        }));

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(members);

        if (membersError) {
          console.error('Erreur lors de l\'ajout des membres:', membersError);
        }
      }
    }

    return group as Group;
  }

  async updateGroup(id: string, updates: Partial<CreateGroupInput>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Vérifier que l'utilisateur est propriétaire
    const { data: group } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!group) throw new Error('Groupe non trouvé');
    if (group.owner_id !== user.id) {
      throw new Error('Seul le propriétaire peut modifier le groupe');
    }

    const { data, error } = await supabase
      .from('groups')
      .update({
        name: updates.name,
        description: updates.description,
      })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Groupe non trouvé');
    return data as Group;
  }

  async deleteGroup(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Vérifier que l'utilisateur est propriétaire
    const { data: group } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!group) throw new Error('Groupe non trouvé');
    if (group.owner_id !== user.id) {
      throw new Error('Seul le propriétaire peut supprimer le groupe');
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;
  }

  async addMember(groupId: string, userId: string, role: 'admin' | 'member' = 'member') {
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role,
      });

    if (error) throw error;
  }

  async removeMember(groupId: string, userId: string) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member') {
    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async shareEventWithGroup(eventId: string, groupId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    // Vérifier que l'événement appartient à l'utilisateur
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (!event) throw new Error('Événement non trouvé');
    if (event.user_id !== user.id) {
      throw new Error('Seul le propriétaire peut partager l\'événement');
    }

    // Vérifier que l'utilisateur a accès au groupe
    const { data: group } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', groupId)
      .single();

    if (!group) throw new Error('Groupe non trouvé');
    if (group.owner_id !== user.id) {
      // Vérifier si l'utilisateur est membre
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        throw new Error('Vous devez être membre du groupe pour partager');
      }
    }

    // Récupérer les membres du groupe
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (membersError) throw membersError;

    // Créer les partages d'événements (éviter les doublons)
    const existingShares = await supabase
      .from('shared_events')
      .select('shared_with')
      .eq('event_id', eventId);

    const existingUserIds = new Set(
      existingShares.data?.map((s) => s.shared_with) || []
    );

    const shares = (members || [])
      .filter((member) => !existingUserIds.has(member.user_id))
      .map((member) => ({
        event_id: eventId,
        shared_with: member.user_id,
        can_edit: false,
      }));

    if (shares.length > 0) {
      const { error: sharesError } = await supabase
        .from('shared_events')
        .insert(shares);

      if (sharesError) throw sharesError;
    }
  }
}

export const groupsService = new GroupsService();

