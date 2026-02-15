import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_cubit.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_state.dart';
import 'package:nose2floor/features/pushup_counter/presentation/widgets/active_session_view.dart';
import 'package:nose2floor/features/pushup_counter/presentation/widgets/inactive_view.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<PushupCubit, PushupState>(
        builder: (context, state) {
          if (state.isActive) {
            return const ActiveSessionView();
          }
          return const InactiveView();
        },
      ),
    );
  }
}
